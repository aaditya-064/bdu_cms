"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPagination = void 0;
const getPagination = (totalCount, perPage, currentPage) => {
    const totalPage = Math.ceil(totalCount / perPage);
    const nextPage = currentPage < totalPage ? currentPage + 1 : null;
    const prevPage = currentPage > 1 ? currentPage - 1 : null;
    return {
        total_count: totalCount,
        total_page: totalPage,
        next_page: nextPage,
        current_page: currentPage,
        prev_page: prevPage,
    };
};
exports.getPagination = getPagination;
