import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {MergeRequest} from '../models/merge-request';
import {GitApiService} from './git-api.service';

export class MergeRequestDataSource extends DataSource<MergeRequest | undefined> {

  private pageSize = 1;
  private lastPage = 0;
  public cachedMergeRequests = Array.from<MergeRequest>({ length: 0 });
  public dataStream = new BehaviorSubject<(MergeRequest | undefined)[]>(this.cachedMergeRequests);
  public subscription = new Subscription();

  constructor(private api: GitApiService) {
    super();

    // Start with some data.
    this._fetchFactPage(0);
  }

  connect(collectionViewer: CollectionViewer): Observable<(MergeRequest | undefined)[] | ReadonlyArray<MergeRequest | undefined>> {
    this.subscription.add(collectionViewer.viewChange.subscribe(range => {
      const currentPage = this._getPageForIndex(range.end);
      if (currentPage > this.lastPage) {
        this.lastPage = currentPage;
        console.log(currentPage);
        this._fetchFactPage(currentPage);
      }
    }));
    return this.dataStream;
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.subscription.unsubscribe();
  }

  private _fetchFactPage(range: number): void {
    for (let i = 0; i < this.pageSize; ++i) {
      this.api.mergeRequests(range).subscribe(res => {
        this.cachedMergeRequests = this.cachedMergeRequests.concat(res);
        this.dataStream.next(this.cachedMergeRequests);
      });
    }
  }

  private _getPageForIndex(i: number): number {
    return Math.floor(i / (this.pageSize * 2));
  }
}