import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WikiParserService {
  private _typeReg = /(^.*?)\|/i; // RegExp for match field type

  constructor() { }

  public parseField(field: string) {
    const type = this._detectType(field);

    switch (type) {

      case ('plainlist'):
        return this.parsePlainList(field);

      case ('hlist'):
        return this.parseHashList(field);

      default:
        return field;
    }
  }

  public getFieldPageContent(pageContent: string, fieldName: string): string | null {
    const reg: RegExp = this._getReqularExprForFieldExec(fieldName);
    const match = pageContent.match(reg);
    const fieldValue = match && match[1];

    return fieldValue;
  }


  private _getReqularExprForFieldExec(fieldName: string) {
    return new RegExp(`${fieldName} *= *{{((?:.|\r|\n)*?)}}`, 'mi');
  }

  public parsePlainList(data: string) {
    const list = data
      .match(/[$\n\r]\* *(.*)/igm)
      .map(match => match.replace('\n* ', ''));

    return list;
  }

  public parseHashList(data: string) {
    return data
      .match(/\[\[(.*?)\]\]/igm)
      .map(line => line.replace(/\|.*\]\]/, ']]'));
  }

  private _detectType(data: string): string {
    const typeMatch: RegExpMatchArray = data.match(this._typeReg);

    if (!typeMatch) {
      return null;
    }

    return typeMatch[1]
      .replace(' ', '')
      .toLowerCase();
  }

}
