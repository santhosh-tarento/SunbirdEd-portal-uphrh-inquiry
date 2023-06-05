import { Component, Input, OnInit } from '@angular/core';
import { IScoreDetails } from '../../interfaces';
import { ResourceService } from '../../services/index';

@Component({
  selector: 'app-score-details',
  templateUrl: './score-details.component.html',
  styleUrls: ['./score-details.component.scss']
})
export class ScoreDetailsComponent implements OnInit {
   /**
  * data is used to render IScoreDetails value on the view
  */
   @Input() data: IScoreDetails;

  constructor(public resourceService: ResourceService) { 
    this.resourceService= resourceService;
  }

  ngOnInit(): void {
  }

}
