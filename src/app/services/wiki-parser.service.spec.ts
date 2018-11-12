import { TestBed } from '@angular/core/testing';

import { WikiParserService } from './wiki-parser.service';

describe('WikiParserService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: WikiParserService = TestBed.get(WikiParserService);
    expect(service).toBeTruthy();
  });
});
