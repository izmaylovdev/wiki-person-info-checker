import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WikiParserService {
  private _typeReg = /(^.*?)\|/i; // RegExp for match field type

  constructor() { }

  public parseField(field: string) {
    const type = this._detectType(field);
    console.log(type, field);
    switch (type) {

      case ('plainlist'):
        return this.parsePlainList(field);

      case ('hlist'):
        return this.parseHashList(field);

      case ('ublist'):
        return this.parseUblist(field);

      case ('marriage'):
        return this.parseMarriage(field);

      default:
        return this.parsePlainText(field);
    }
  }

  public getFieldFromPageContent(pageContent: string, fieldName: string): string | null {
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

    return list || [];
  }

  public parseMarriage(data: string) {
    data.replace(/<\w+>/g, '');

    const arr = (/marriage\|((\[\[[\w \.]+(\]\]|\|))|([\w \.]+))/im).exec(data);
    const match = arr[1].replace('|', ']]');

    return [ match ];
  }

  public parseHashList(data: string) {
    return data
      .match(/\[\[(.*?)\]\]/igm)
      .map(line => line.replace(/\|.*\]\]/, ']]'));
  }

  public parseUblist(data: string) {
    return data
      .match(/(\[\[([\w \.]+)(:?\]\]|\|))/igm)
      .map(line => line.replace('|', ']]'));
  }

  public parsePlainText(data: string) {
    const match = data.match(/\[\[[\w \.]*(?:[\]\|]*)/igm);
    if (match) {
      return match.map(line => line.replace('|', ']]'));
    } else {
      return [ data ];
    }
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
