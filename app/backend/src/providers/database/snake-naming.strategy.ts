import { DefaultNamingStrategy, type NamingStrategyInterface } from 'typeorm';
import { snakeCase } from 'typeorm/util/StringUtils.js';

/** Column and join names are snake_case. typeorm-naming-strategies does not support TypeORM 1. */
export class SnakeNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  public override columnName(
    propertyName: string,
    customName: string,
    embeddedPrefixes: string[],
  ): string {
    return snakeCase(
      embeddedPrefixes.concat(customName || propertyName).join('_'),
    );
  }

  public override joinColumnName(
    relationName: string,
    referencedColumnName: string,
  ): string {
    return snakeCase(`${relationName}_${referencedColumnName}`);
  }

  public override joinTableColumnName(
    tableName: string,
    propertyName: string,
    columnName?: string,
  ): string {
    return snakeCase(`${tableName}_${columnName ?? propertyName}`);
  }
}
