import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable, forkJoin, from, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { environment } from 'src/environments/environment';

import { WikiParserService } from './wiki-parser.service';
import IPersonInfo from '../models/person-info..model';
import IFamilyMember from '../models/family-member.model';
import CheckResults from '../models/check-results.model';

type FieldName = 'spouse' | 'parents' | 'children';

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
      switchMap((personInfo: IPersonInfo) => {
        return forkJoin(this._fields.map((fieldName: FieldName) => {
          const fieldVal = personInfo[fieldName];

          if (Array.isArray(fieldVal)) {
            return forkJoin(fieldVal.map((name: string) => {

              const pageTitle: string = this.getPageTitle(name);
              return pageTitle ?
                this.getPageShortInfo(pageTitle).pipe(map(res => ({ name: pageTitle, value: res } as IFamilyMember))) :
                of({ name: name, status: 'Can\'t check' } as CheckResults);

            })).pipe(
              map(value => ({ fieldName, value }))
            );
          } else {
            return of([{ fieldName, value: fieldVal }]);
          }

        }));
      }),
      // map(((fieldsArr: { filedName: FieldName; value: CheckResults | IFamilyMember; }[])) => {
      //   return fieldsArr.reduce((res, field) => {
      //     res[field.fieldName] = [];

      //     switch (field.fieldName) {
      //       case('children'):
      //         if ()
      //         const isValid = this.checkChildrens(title, field.value);
      //         res[field.fieldName].push({
      //           name: field.value.name,
      //           status: isValid ? 'Matched' : 'Does not match'
      //         });
      //         break;
      //       default:
      //         return res;
      //     }
      //   }, {} as CheckResults);
      // })
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

  getPageTitle(field) {
    const match: RegExpMatchArray = (/\[\[(.*)\]\]/g).exec(field);
    return match && match[1];
  }

  private checkChildrens(title: string, childrensInfo: IFamilyMember[]) {
    return childrensInfo.reduce((res, childrenInfo) => {
      return [ ...res, {
        name: childrenInfo.name,
        status: this.checkChildren(title, childrenInfo.value)
      }];
    }, []);
  }

  private checkChildren(title: string, childrenInfo: IPersonInfo): boolean {
    const parsedTitle = title.replace('_', ' ');
    return (childrenInfo.parents as string[]).some(parent => parent.indexOf(parsedTitle) !== -1);
  }
}
