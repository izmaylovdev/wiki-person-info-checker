import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';

export interface IFormState {
  link: string;
}

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent {
  public form: FormGroup;

  @Output() formSubmit: EventEmitter<IFormState> = new EventEmitter();

  constructor(private _fb: FormBuilder) {
    this.form = this._fb.group({
      link: ['', Validators.compose([
          Validators.required,
          Validators.pattern(/^https:\/\/(\w+\.)?wikipedia.org\/wiki\/(.*)$/)
      ])]
    });
  }

  submitHandler(form: FormGroup) {
    if (form.valid) {
      this.formSubmit.emit(form.value);
    }
  }

}
