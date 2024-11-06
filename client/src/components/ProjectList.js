// src/components/ProjectList.js
import React, { useEffect, useState } from "react";
import { Table, message } from "antd";
import axios from "axios";

const BASE_URL = "http://localhost:9999"; // Update with your backend URL

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/projects`);
      setProjects(response.data.data);
    } catch (error) {
      message.error("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const columns = [
    {
      title: "Project Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleDateString(),
    },
  ];

  return (
    <Table
      rowKey="_id" // assuming MongoDB ObjectId
      columns={columns}
      dataSource={projects}
      loading={loading}
      pagination={{ pageSize: 10 }}
    />
  );
};

export default ProjectList;
