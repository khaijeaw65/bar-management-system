import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ExpoConfigService {
  public constructor(private readonly configService: ConfigService) {}

  /** Only set when "enhanced push security" is on in the Expo account. */
  public get accessToken(): string | undefined {
    return this.configService.get('expo.accessToken');
  }
}
