type TableType = {
  tableHeading: { value: string; colSpan: string }[];
  tableData: {
    value: string | number;
    colSpan: string;
    type?: "warning" | "info" | "success" | "error";
  }[][];
  showSearch?: boolean | undefined;
  showOptions?: boolean | undefined;
};

const Table = ({
  tableHeading,
  tableData,
  showSearch,
  showOptions,
}: TableType) => {
  return (
    <div className="w-full h-fit flex flex-col font-sans">
      {/* Table Heading */}
      <div className="h-10 grid grid-cols-12 bg-accent-light font-medium text-accent rounded-md">
        {tableHeading.map((rowCol, key) => (
          <div
            className={`h-full flex items-center pl-2 text-sm leading-none ${
              key < tableHeading.length - 1 ? "border-r" : ""
            } border-accent-mid ${rowCol.colSpan}`}
            key={key}
          >
            {rowCol.value}
          </div>
        ))}
      </div>

      {/* Table Content */}
      {tableData.map((row, key) => (
        <div
          className={`h-12 grid grid-cols-12  border-b border-theme-gray-mid`}
          key={key}
        >
          {row.map((rowCol, key) => (
            <div
              className={`h-full flex items-center pl-2 text-sm text-theme-gray ${rowCol.colSpan}`}
              key={key}
            >
              {rowCol.type !== undefined ? (
                <span
                  className={`text-xs rounded-sm py-[1px] px-1.5 ${
                    rowCol.type === "warning"
                      ? "text-theme-warning bg-theme-warning/5"
                      : rowCol.type === "info"
                      ? "text-theme-info bg-theme-info/5"
                      : rowCol.type === "success"
                      ? "text-theme-success bg-theme-success/5"
                      : "text-theme-error bg-theme-error/5"
                  }`}
                >
                  {rowCol.value}
                </span>
              ) : (
                rowCol.value
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Table;
