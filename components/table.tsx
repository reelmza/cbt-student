type TableType = {
  tableHeading: { value: string; colSpan: string }[];
  tableData: { value: string | number; colSpan: string }[][];
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
    <div className="w-full h-fit flex flex-col">
      {/* Table Heading */}
      <div className="h-12 grid grid-cols-12 border-b border-theme-gray-mid font-semibold">
        {tableHeading.map((item, key) => (
          <div
            className={`h-full flex items-center pl-2  text-sm ${item.colSpan}`}
            key={key}
          >
            {item.value}
          </div>
        ))}
      </div>

      {/* Table Content */}
      {tableData.map((item, key) => (
        <div
          className={`h-12 grid grid-cols-12 ${
            key % 2 == 0 ? "bg-theme-gray-light" : ""
          } border-b border-theme-gray-mid`}
          key={key}
        >
          {item.map((itemX, key) => (
            <div
              className={`h-full flex items-center pl-2 text-sm ${itemX.colSpan} `}
              key={key}
            >
              {itemX.value}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Table;
