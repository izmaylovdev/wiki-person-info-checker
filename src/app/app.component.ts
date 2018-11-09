import { Component } from '@angular/core';
import { IFormState } from './components/form/form.component';
import { WikipediaService } from './services/wikipedia.service';
import { Observable } from 'rxjs';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public personInfo$: Observable<any>;
  public link:        string;

  constructor(private _wikiService: WikipediaService) {}

  formSubmitHandler({ link }: IFormState) {
    this.link = link;
    this.updatePerson(link);
  }

  updatePerson(link: string) {
    this.personInfo$ = this._wikiService.getPagesInfo(link);
  }
}
