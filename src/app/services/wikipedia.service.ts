import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable, forkJoin, from, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { environment } from 'src/environments/environment';

import { WikiParserService } from './wiki-parser.service';

@Injectable({
  providedIn: 'root'
})
export class WikipediaService {
  private _titleReg: RegExp = /^https:\/\/(\w+\.)?wikipedia.org\/wiki\/(.*)$/i;
  private _fields = [ 'spouse', 'parents', 'children' ];

  public API_URL: string = environment.API_URL;

  constructor(
    private _http: HttpClient,
    private _wikiParser: WikiParserService
  ) {}

  /**
   * get content from Wikipedia page
   * @param link to the Wikipedia page
   */
  getPagesInfo(link: string): Observable<any> {
    const title = this.getWikipediaPageTitle(link);

    return this._http.get<any>(this.API_URL + title).pipe(
      map(res => res.query.pages[0].revisions[0].content),
      map(content => {
        return this._fields
          .map(fieldName => ({
            fieldName,
            fieldContent: this._wikiParser.getFieldPageContent(content, fieldName)
          }))
          .map((field) => {
            if (field.fieldContent) {
              return { ...field, fieldContent: this._wikiParser.parseField(field.fieldContent) };
            }
            return field;
          })
          .reduce((acc, { fieldName, fieldContent }) => {
            return { ...acc, [fieldName]: fieldContent };
          }, {});
      }),
      switchMap(personInfo => {
        return forkJoin(this._fields.map(fieldName => {
          const fieldVal = personInfo[fieldName];

          if (Array.isArray(fieldVal)) {
            return forkJoin(fieldVal.map((field: string) => {
              if (field.indexOf('[[') !== -1) {
                const titleMatch = (/\[\[(.*)\]\]/g).exec(field);
                return this.getPageShortInfo(titleMatch[1]);
              } else {
                return of({ fieldName, value: field });
              }
            })).pipe(
              map(value => ({ fieldName, value }))
            );
          } else {
            return of({ fieldName, value: fieldVal });
          }

        }));
      })
    );
  }

  getPageShortInfo(link: string) {
    const title = this.getWikipediaPageTitle(link);

    return this._http.get<any>(this.API_URL + title).pipe(
      map(res => res.query.pages[0].revisions[0].content),
      map(content => {
        return this._fields
          .map(fieldName => ({
            fieldName,
            fieldContent: this._wikiParser.getFieldPageContent(content, fieldName)
          }))
          .map((field) => {
            if (field.fieldContent) {
              return { ...field, fieldContent: this._wikiParser.parseField(field.fieldContent) };
            }
            return field;
          })
          .reduce((acc, { fieldName, fieldContent }) => {
            return { ...acc, [fieldName]: fieldContent };
          }, {});
      })
    );
  }

  getWikipediaPageTitle(str: string) {
    const match = str.match(this._titleReg);

    return match ? match[2] : str;
  }

}
