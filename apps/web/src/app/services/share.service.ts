import { Injectable } from '@angular/core';

type ShareData = {
  title?: string;
  text?: string;
  url?: string;
};

@Injectable()
export class ShareService {
  readonly isSupported: boolean;

  constructor() {
    this.isSupported = !!(navigator as any).share;
  }

  share(data: ShareData): Promise<void> {
    if (!(navigator as any).share) {
      return;
    }
    return (navigator as any).share(data).catch(); // do nothing with failed share, but have to handle. For example "Share dialog was closed".
  }
}
