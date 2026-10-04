export const getPagination = (
  totalCount: number,
  perPage: number,
  currentPage: number,
) => {
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
