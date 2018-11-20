import { MatPaginatorIntl } from '@angular/material/paginator';

const dutchRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length == 0 || pageSize == 0) { return `0条 共${length}条`; }

    length = Math.max(length, 0);

    const startIndex = page * pageSize;

    // If the start index exceeds the list length, do not try and fix the end index to the end.
    const endIndex = startIndex < length ?
        Math.min(startIndex + pageSize, length) :
        startIndex + pageSize;

    return `${startIndex + 1} - ${endIndex}条 共${length}条`;
}

export function getDutchPaginatorIntl() {
    const paginatorIntl = new MatPaginatorIntl();

    paginatorIntl.itemsPerPageLabel = '每页项目: ';
    paginatorIntl.firstPageLabel = '首页';
    paginatorIntl.lastPageLabel = '末页';
    paginatorIntl.nextPageLabel = '上一页';
    paginatorIntl.previousPageLabel = '下一页';
    paginatorIntl.getRangeLabel = dutchRangeLabel;

    return paginatorIntl;
}