import {
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
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthMeSchema, type AuthMe } from '@bar/contracts';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator.js';
import type { CurrentUserPayload } from '../../../../common/decorators/current-user.decorator.js';
import { Public } from '../../../../common/decorators/public.decorator.js';
import { ApiEnvelopedOk } from '../../../../common/openapi/api-enveloped.js';
import { AppConfigService } from '../../../../providers/config/app/config.service.js';
import { JwtConfigService } from '../../../../providers/config/jwt/config.service.js';
import { AuthService } from '../../application/auth.service.js';
import { clearSessionCookies, writeSessionCookies } from './auth-cookies.js';

const AuthOkSchema = z.object({ ok: z.literal(true) });
type AuthOkResponse = z.infer<typeof AuthOkSchema>;
type RedirectTarget = { url: string; statusCode: number };

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
  @ApiResponse({
    status: 302,
    description: 'Redirect to the LINE authorize URL',
  })
  public async lineLogin(): Promise<RedirectTarget> {
    return { url: await this.authService.startLineLogin(), statusCode: 302 };
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
      'Redirect to the frontend home, or to a login error URL. No JSON envelope.',
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
  public async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthOkResponse> {
    await this.authService.logout(req.cookies?.refresh_token);
    clearSessionCookies(res, this.appConfig.nodeEnv);
    return { ok: true };
  }

  @Get('me')
  @ApiOperation({
    summary: 'Current staff user',
    description:
      'Access token from the access_token cookie, or Authorization: Bearer.',
  })
  @ApiEnvelopedOk(AuthMeSchema)
  public me(@CurrentUser() user: CurrentUserPayload): Promise<AuthMe> {
    return this.authService.getCurrentStaffUser(user.sub);
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
