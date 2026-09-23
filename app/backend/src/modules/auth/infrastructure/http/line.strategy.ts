import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
// TODO: implement line.strategy
@Injectable()
export class LineStrategy extends PassportStrategy(Object as any, 'line') {}
