import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { BookmarksBaseUnionType, BookmarksFolder, BookmarksParserResult } from '../bookmarks-parser/parser.interface';
import { setStateProperties } from '../../../../helpers/state.helper';

@Component({
  selector: 'tt-items-import-list',
  templateUrl: './items-import-list.component.pug',
  styleUrls: ['./items-import-list.component.sass'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImportBulkListComponent {
  @Input() items: BookmarksParserResult;
  @Input() level = 0;

  toggle(base: BookmarksBaseUnionType, value?: boolean): BookmarksBaseUnionType {
    const valueProvided = value === true || value === false;
    const isSelected = valueProvided ? value : !base.isSelected; // use provided value or toggle existing one
    if (base.type === 'folder') {
      const folder = base as BookmarksFolder;
      folder.children = [...folder.children.map(child => this.toggle(child, isSelected))];
    }
    return setStateProperties(base, { isSelected });
  }

  toggleExpansion(folder: BookmarksFolder): void {
    folder.isExpanded = !folder.isExpanded;
  }
}
