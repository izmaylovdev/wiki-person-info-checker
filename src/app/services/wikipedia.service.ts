import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { environment } from 'src/environments/environment';

import { WikiParserService } from './wiki-parser.service';
import IPersonInfo from '../models/person-info..model';
import IFamilyMember from '../models/family-member.model';
import CheckResults from '../models/check-results.model';
import IFamilyMemberGroup from '../models/family-group.model';
import skipResults from '../helpers/skipResults.decorator';

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
   * @param link link to the Wikipedia page of Title of Wikipedia page
   */
  getPageInfo(link: string): Observable<any> {
    const title = this.getWikipediaPageTitle(link);

    return this._getPageContent(title).pipe(
      // get info about [children, supouse, parents] fields
      map(content => {
        return this._fields
          .map(fieldName => ({
            fieldName,
            fieldContent: this._wikiParser.getFieldFromPageContent(content, fieldName)
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

      // load data about family members if can't load returns check results
      switchMap((personInfo: IPersonInfo) => {
        return forkJoin(this._fields.map((groupName: FieldName) => {
          const members = personInfo[groupName];
          const observables: Array<Observable<IFamilyMember | CheckResults>> = (members || []).map((name: string) => {
            const pageTitle: string = this.getPageTitle(name);
            return pageTitle ?
              this.getPageShortInfo(pageTitle).pipe(
                map(res => ({ name: pageTitle, info: res } as IFamilyMember))
              ) :
              of({ name: name, status: 'Can\'t check' } as CheckResults);

          });

          return forkJoin(observables).pipe(
            map((fetchedMemebers) => ({ groupName, members: fetchedMemebers }))
          );

        }));
      }),

      // check matches
      map((fieldsArr: IFamilyMemberGroup[]) => {
        return fieldsArr.map(group => {
          switch (group.groupName) {

            case 'children':
              return {
                groupName: group.groupName,
                members: group.members.map(skipResults(member => {
                  return {
                    name: member.name,
                    status: this._checkChildren(title, member.info) ? 'Match' : 'Does not match'
                  };
                }))
              };

            case 'spouse':
              return {
                groupName: group.groupName,
                members: group.members.map(skipResults(member => {
                  return {
                    name: member.name,
                    status: this._checkSupose(title, member.info) ? 'Match' : 'Does not match'
                  };
                }))
              };

            case 'parents':
              return {
                groupName: group.groupName,
                members: group.members.map(skipResults(member => {
                  return {
                    name: member.name,
                    status: this._checkParent(title, member.info) ? 'Match' : 'Does not match'
                  };
                }))
              };
          }

        });
      })
    );
  }

  getPageShortInfo(link: string) {
    const title = this.getWikipediaPageTitle(link);

    return this._getPageContent(title).pipe(
      map(content => {
        return this._fields
          .map(fieldName => ({
            fieldName,
            fieldContent: this._wikiParser.getFieldFromPageContent(content, fieldName)
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

    return match ? match[2] : str.replace(/\s/g, '_');
  }

  getPageTitle(field) {
    const match: RegExpMatchArray = (/\[\[(.*)\]\]/g).exec(field);
    return match && match[1];
  }

  private _getPageContent(link: string): Observable<string> {
    const title = this.getWikipediaPageTitle(link);

    return this._http.get<any>(this.API_URL + title).pipe(
      map(res => res.query.pages[0].revisions[0].content),

      // checking for redirect path
      switchMap(res => {
        const redirectReg = /\#redirect \[\[([\w ]+)\]\]/igm;
        const redirectMatch = redirectReg.exec(res);

        if (redirectMatch) {
          return this._getPageContent(redirectMatch[1]);
        } else {
          return of(res as string);
        }
      })
    );
  }

  private _checkChildren(title: string, childrenInfo: IPersonInfo): boolean {
    const parsedTitle = title.replace(/\_/g, ' ');
    return (childrenInfo.parents as string[] || []).some(parent => parent.search(parsedTitle) !== -1);
  }

  private _checkSupose(title: string, supouses: IPersonInfo): boolean {
    const parsedTitle = title.replace(/\_/g, ' ');
    return (supouses.spouse as string[] || []).some(parent => parent.search(parsedTitle) !== -1);
  }

  private _checkParent(title: string, parent: IPersonInfo): boolean {
    const parsedTitle = title.replace(/\_/g, ' ');
    return (parent.children as string[] || []).some(children => children.search(parsedTitle) !== -1);
  }
}
