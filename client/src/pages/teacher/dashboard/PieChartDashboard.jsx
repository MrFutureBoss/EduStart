import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Label } from "recharts";
import "../../../style/Dashboard/PieChartStyles.css";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const PieChartDashboard = ({ classData, onSectionClick }) => {
  const [highlightedClass, setHighlightedClass] = useState(null);
  if (!classData || classData.length <= 1) {
    return null;
  }
  const pieChartData = (classData || []).map((cls) => ({
    name: cls.className,
    value: cls.totalIssues,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { name, value } = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="label">{`Lớp: ${name}`}</p>
          <p className="intro">{`Tổng số vấn đề: ${value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="pie-chart-container">
      <p
        style={{
          fontSize: "16px",
          marginLeft: "10px",
          fontWeight: "500",
        }}
      >
        Tỉ lệ vấn đề giữa các lớp
      </p>
      <div className="chart-legend">
        {pieChartData.map((entry, index) => (
          <div key={entry.name} className="legend-item">
            <span
              className="legend-color"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            ></span>
            <span className="legend-text">{entry.name}</span>
          </div>
        ))}
      </div>
      <p className="description-text-pie">
        Click vào phần của lớp để đưa lớp đó lên đầu bảng vấn đê.
      </p>
      <PieChart width={100} height={100} style={{ margin: "auto" }}>
        <Pie
          data={pieChartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={50}
          fill="#8884d8"
          onClick={(data) => onSectionClick(data.name)}
          onMouseEnter={(data) => setHighlightedClass(data.name)}
          onMouseLeave={() => setHighlightedClass(null)}
        >
          {pieChartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
              className={
                highlightedClass === entry.name ? "highlighted-section" : ""
              }
            />
          ))}
          <Label
            content={({ viewBox, payload }) =>
              payload && payload.length > 0
                ? payload.map((entry, index) => (
                    <text
                      key={`label-${index}`}
                      x={viewBox.cx}
                      y={viewBox.cy - 10 * index}
                      fill="#000"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="12"
                    >
                      {entry.name}
                    </text>
                  ))
                : null
            }
          />
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </div>
  );
};

export default PieChartDashboard;
