import React, { useEffect, useState } from "react";
import { Table, message } from "antd";
import axios from "axios";

const InvestmentProjectList = () => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        const response = await axios.get("http://localhost:9999/api/investments");
        setInvestments(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch investments:", error);
        message.error("Failed to fetch investments.");
        setLoading(false);
      }
    };

    fetchInvestments();
  }, []);

  const columns = [
    {
      title: "Sponsor Name",
      dataIndex: ["userId", "username"],
      key: "sponsorName",
    },
    {
      title: "Project Name",
      dataIndex: ["projectId", "name"],
      key: "projectName",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => new Date(date).toLocaleDateString(),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={investments}
      rowKey={(record) => record._id}
      loading={loading}
      pagination={{ pageSize: 10 }}
    />
  );
};

export default InvestmentProjectList;
