import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Redirect,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  AuthMeSchema,
  MobileRefreshRequestSchema,
  MobileTokenRequestSchema,
  MobileTokenResponseSchema,
  type AuthMe,
  type MobileTokenResponse,
} from '@bar/contracts';
import type { Request, Response } from 'express';
import { AnyStaff } from '../../../../common/decorators/any-staff.decorator.js';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator.js';
import type { CurrentUserPayload } from '../../../../common/decorators/current-user.types.js';
import { Public } from '../../../../common/decorators/public.decorator.js';
import { ApiEnvelopedOk } from '../../../../common/openapi/api-enveloped.js';
import { zodToOpenApi } from '../../../../common/openapi/zod-to-openapi.js';
import { AppConfigService } from '../../../../providers/config/app/config.service.js';
import { JwtConfigService } from '../../../../providers/config/jwt/config.service.js';
import { AuthService } from '../../application/auth.service.js';
import type { MobileTokenResult } from '../../application/auth.types.js';
import { clearSessionCookies, writeSessionCookies } from './auth-cookies.js';
import {
  AuthOkSchema,
  LogoutRequestSchema,
  type AuthOkResponse,
  type RedirectTarget,
} from './dto/auth.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  public constructor(
    private readonly authService: AuthService,
    private readonly appConfig: AppConfigService,
    private readonly jwtConfig: JwtConfigService,
  ) {}

  @Get('line/login')
  @Public()
  @Redirect()
  @ApiOperation({ summary: 'Start LINE login' })
  @ApiQuery({ name: 'client', required: false })
  @ApiQuery({ name: 'code_challenge', required: false })
  @ApiQuery({ name: 'code_challenge_method', required: false })
  @ApiResponse({
    status: 302,
    description: 'Redirect to the LINE authorize URL',
  })
  @ApiBadRequestResponse({
    description: 'client=mobile without a valid S256 code_challenge',
  })
  public async lineLogin(
    @Query('client') client?: string,
    @Query('code_challenge') codeChallenge?: string,
    @Query('code_challenge_method') codeChallengeMethod?: string,
  ): Promise<RedirectTarget> {
    const url = await this.authService.startLineLogin({
      client,
      codeChallenge,
      codeChallengeMethod,
    });
    return { url, statusCode: 302 };
  }

  @Get('line/callback')
  @Public()
  @Redirect()
  @ApiOperation({ summary: 'LINE login callback' })
  @ApiQuery({ name: 'code', required: false })
  @ApiQuery({ name: 'state', required: false })
  @ApiQuery({ name: 'error', required: false })
  @ApiResponse({
    status: 302,
    description:
      'Redirect to the frontend, a frontend login error, or barapp://auth for mobile. No JSON envelope.',
  })
  public async lineCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RedirectTarget> {
    const result = await this.authService.handleLineCallback({
      code,
      state,
      error,
    });
    if (result.kind === 'session') {
      this.writeCookies(res, result.accessToken, result.refreshToken);
    }
    return { url: result.location, statusCode: 302 };
  }

  @Post('mobile/token')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a mobile login code for a bearer token pair' })
  @ApiBody({ schema: zodToOpenApi(MobileTokenRequestSchema) })
  @ApiEnvelopedOk(MobileTokenResponseSchema)
  public mobileToken(@Body() body: unknown): Promise<MobileTokenResponse> {
    const parsed = MobileTokenRequestSchema.parse(body);
    return this.mobileTokens(this.authService.exchangeMobileCode(parsed));
  }

  @Post('mobile/refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate a mobile refresh token' })
  @ApiBody({ schema: zodToOpenApi(MobileRefreshRequestSchema) })
  @ApiEnvelopedOk(MobileTokenResponseSchema)
  public mobileRefresh(@Body() body: unknown): Promise<MobileTokenResponse> {
    const parsed = MobileRefreshRequestSchema.parse(body);
    return this.mobileTokens(this.authService.refreshMobile(parsed.refreshToken));
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotate the refresh token',
    description:
      'Public to the access-token guard. The refresh cookie is the credential, so an expired access cookie can still be rotated.',
  })
  @ApiEnvelopedOk(AuthOkSchema)
  public async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthOkResponse> {
    const result = await this.authService.refresh(req.cookies?.refresh_token);
    if (result.kind === 'unauthorized') {
      clearSessionCookies(res, this.appConfig.nodeEnv);
      throw new UnauthorizedException();
    }
    this.writeCookies(res, result.accessToken, result.refreshToken);
    return { ok: true };
  }

  @Post('logout')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke this session and clear cookies' })
  @ApiEnvelopedOk(AuthOkSchema)
  @ApiBody({ schema: zodToOpenApi(LogoutRequestSchema), required: false })
  public async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: unknown,
  ): Promise<AuthOkResponse> {
    await this.authService.logout(this.logoutRefreshToken(req, body));
    clearSessionCookies(res, this.appConfig.nodeEnv);
    return { ok: true };
  }

  @Get('me')
  @AnyStaff()
  @ApiOperation({
    summary: 'Current staff user',
    description:
      'Access token from the access_token cookie, or Authorization: Bearer.',
  })
  @ApiEnvelopedOk(AuthMeSchema)
  public me(@CurrentUser() user: CurrentUserPayload): Promise<AuthMe> {
    return this.authService.getCurrentStaffUser(user.sub);
  }

  private mobileTokens(
    pending: Promise<MobileTokenResult>,
  ): Promise<MobileTokenResponse> {
    return pending.then((result) => this.issuedMobileToken(result));
  }

  private issuedMobileToken(result: MobileTokenResult): MobileTokenResponse {
    if (result.kind !== 'ok') throw new UnauthorizedException();
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: this.jwtConfig.accessTtlSeconds,
    };
  }

  private logoutRefreshToken(req: Request, body: unknown): string | undefined {
    const cookie = req.cookies?.refresh_token;
    if (typeof cookie === 'string' && cookie.length > 0) return cookie;
    return this.bodyRefreshToken(body);
  }

  private bodyRefreshToken(body: unknown): string | undefined {
    if (body === undefined || body === null) return undefined;
    return LogoutRequestSchema.parse(body).refreshToken;
  }

  private writeCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    writeSessionCookies(res, {
      nodeEnv: this.appConfig.nodeEnv,
      accessTtlSeconds: this.jwtConfig.accessTtlSeconds,
      refreshTtlSeconds: this.jwtConfig.refreshTtlSeconds,
      accessToken,
      refreshToken,
    });
  }
}
