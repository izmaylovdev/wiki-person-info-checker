import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from 'src/environments/environment';

import getFieldFromWikiPageContent from '../helpers/getFieldFromWikiPageContent';
@Injectable({
  providedIn: 'root'
})
export class WikipediaService {
  private _titleReg: RegExp = /^https:\/\/(\w+\.)?wikipedia.org\/wiki\/(.*)$/i;
  public API_URL: string = environment.API_URL;

  constructor(
    private _http: HttpClient
  ) {}

  /**
   * get content from Wikipedia page
   * @param link to the Wikipedia page
   */
  getPagesInfo(link: string): Observable<any> {
    const title = this.getWikipediaPageTitle(link);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json; charset=UTF-8'
    });

    return this._http.get<any>(this.API_URL + title, { headers }).pipe(
      map(res => res.query.pages[0].revisions[0].content),
      map(content => content.replace('\n', '')),
      map(content => ({
        supose: this._getSpouse(content),
        children: this._getChildren(content),
        parents: this._getParents(content),
      }))
    );
  }

  getWikipediaPageTitle(link: string) {
    return link.match(this._titleReg)[2];
  }

  private _getSpouse(pageContent: string) {
    return getFieldFromWikiPageContent(pageContent, 'spouse');
  }

  private _getChildren(pageContent: string) {
    return getFieldFromWikiPageContent(pageContent, 'children');
  }

  private _getParents(pageContent: string) {
    return getFieldFromWikiPageContent(pageContent, 'parents');
  }

}
