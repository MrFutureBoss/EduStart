import React, { useEffect, useState } from "react";
import { Tabs, Table, Button, Tag, Avatar, message, Badge } from "antd";
import {
  getAllRequetChangClassAdmin,
  updateTransferRequestStatus,
} from "../../../api";
import TransferClassModal from "../../semester/userModel/TransferClassModal";
import SwapClassModal from "../../semester/userModel/SwapClassModal";
import axios from "axios";
import { BASE_URL } from "../../../utilities/initalValue";
import { useSelector } from "react-redux";
import moment from "moment";
import Search from "antd/es/transfer/search";
import Swal from "sweetalert2";
import { showAlert } from "../../../components/SweetAlert";
import CancelButton from "../../../components/Button/CancelButton";
import ConfirmButton from "../../../components/Button/ConfirmButton";

const { TabPane } = Tabs;

const TransferRequestManagement = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [modalType, setModalType] = useState("");
  const [searchText, setSearchText] = useState(""); // State cho tìm kiếm
  const currentSemester = useSelector(
    (state) => state.semester.currentSemester
  );

  useEffect(() => {
    fetchTransferRequests();
    fetchAvailableClasses();
  }, []);

  const fetchTransferRequests = async () => {
    setLoading(true);
    try {
      const response = await getAllRequetChangClassAdmin();
      setRequests(response.data.data);
    } catch (error) {
      console.error("Failed to fetch transfer requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableClasses = async () => {
    if (!currentSemester?._id) return;
    try {
      const jwt = localStorage.getItem("jwt");
      const config = {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${jwt}`,
        },
      };
      const response = await axios.get(
        `${BASE_URL}/admins/${currentSemester._id}/available/class`,
        config
      );
      setAvailableClasses(response.data.classes);
    } catch (error) {
      console.error("Error fetching available classes:", error);
      message.error("Lỗi khi lấy danh sách lớp khả dụng.");
    }
  };

  const handleProcessRequest = (request) => {
    const targetClass = availableClasses.find(
      (cls) => cls._id === request.requestedClassId._id
    );
    if (!targetClass && request.type === "transfer") {
      message.error("Lớp yêu cầu chuyển đến không có chỗ trống.");
      return;
    }
    setSelectedRequest(request);
    setModalType(request.type); // Xác định loại modal dựa vào `type`
  };

  const handleRejectRequest = async (requestId) => {
    const { value: rejectMessage } = await Swal.fire({
      title: "Xác nhận từ chối yêu cầu",
      input: "textarea",
      inputPlaceholder: "Nhập lý do từ chối...",
      inputValidator: (value) => {
        if (!value.trim()) {
          return "Vui lòng nhập lý do từ chối.";
        }
        return null;
      },
      showCancelButton: true,
      confirmButtonText: "Từ chối yêu cầu",
      cancelButtonText: "Hủy bỏ",
    });

    if (rejectMessage) {
      try {
        await updateTransferRequestStatus(requestId, "rejected", rejectMessage);
        showAlert("Thành công", "Yêu cầu đã bị từ chối.", "success");
        fetchTransferRequests();
      } catch (error) {
        showAlert("Lỗi", "Lỗi khi từ chối yêu cầu.", "error");
      }
    } else {
      showAlert("Đã hủy", "Yêu cầu từ chối đã bị hủy.", "info");
    }
  };

  const handleCloseModal = () => {
    setSelectedRequest(null);
    setModalType("");
  };

  const filteredData = requests.filter((request) => {
    const matchesSearchText =
      request.studentId.username.toLowerCase().includes(searchText) ||
      request.studentId.rollNumber.toLowerCase().includes(searchText) ||
      request.studentId.email.toLowerCase().includes(searchText);

    return matchesSearchText;
  });
  const columns = (showActions, showAcceptedDate) =>
    [
      {
        title: "Thông tin sinh viên",
        dataIndex: "info",
        key: "info",
        render: (_, request) => (
          <div style={{ display: "flex", alignItems: "center" }}>
            <Avatar style={{ marginRight: 16 }}>
              {request.studentId.username.charAt(0)}
            </Avatar>
            <div>
              <div>
                <strong>{request.studentId.username}</strong>
              </div>
              <p style={{ margin: 0, fontStyle: "italic" }}>
                {request.studentId.rollNumber}
              </p>
              <p style={{ margin: 0, fontStyle: "italic" }}>
                {request.studentId.email}
              </p>
            </div>
          </div>
        ),
      },
      {
        title: "Loại yêu cầu",
        dataIndex: "type",
        key: "type",
        render: (type) => (
          <Tag color={type === "transfer" ? "purple" : "cyan"}>
            {type === "transfer" ? "Đơn chuyển lớp" : "Đơn tráo đổi lớp"}
          </Tag>
        ),
      },
      {
        title: "Thông tin chuyển",
        dataIndex: "info",
        key: "info",
        render: (_, request) => (
          <div style={{ display: "flow" }}>
            <Tag color="blue">
              Lớp hiện tại: {request.currentClassId.className}
            </Tag>
            <Tag color="green" style={{ marginTop: 8 }}>
              Lớp chuyển : {request.requestedClassId.className}
            </Tag>
          </div>
        ),
      },
      {
        title: "Lý do",
        dataIndex: "reason",
        key: "reason",
        render: (reason) => <p>{reason}</p>,
      },
      {
        title: "Ngày tạo",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (createdAt) => moment(createdAt).format("DD/MM/YYYY HH:mm"),
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        render: (status) => (
          <Tag
            color={
              status === "approved"
                ? "green"
                : status === "rejected"
                ? "red"
                : "orange"
            }
          >
            {status === "approved"
              ? "Đã chấp nhận"
              : status === "rejected"
              ? "Đã từ chối"
              : "Chờ xử lý"}
          </Tag>
        ),
      },
      showAcceptedDate && {
        title: "Ngày xử lý",
        dataIndex: "updatedAt",
        key: "updatedAt",
        render: (updatedAt, record) =>
          record.status === "approved" || record.status === "rejected"
            ? moment(updatedAt).format("DD/MM/YYYY HH:mm")
            : "-",
      },
      showActions && {
        title: "Hành động",
        key: "action",
        render: (_, request) =>
          request.status === "pending" && (
            <div style={{ display: "flow" }}>
              <ConfirmButton
                onClick={() => handleProcessRequest(request)}
                style={{ width: "5rem", marginBottom: 10 }}
                content="Xử lý"
              ></ConfirmButton>
              <CancelButton
                content="Từ chối"
                onClick={() => handleRejectRequest(request._id)}
              ></CancelButton>
            </div>
          ),
      },
    ].filter(Boolean);

  const pendingRequests = filteredData.filter(
    (request) => request.status === "pending"
  );
  const processedRequests = filteredData.filter(
    (request) => request.status !== "pending"
  );

  return (
    <div>
      {/* <h3 className="header-content-mentor-detail">Danh sách yêu cầu hỗ trợ</h3> */}
      <div
        style={{
          minHeight: 500,
          marginTop: 20,
          backgroundColor: "rgb(245 245 245 / 31%)",
          borderRadius: "10px",
        }}
      >
        <div style={{ width: "500px" }}>
          {" "}
          <Search
            placeholder="Tìm kiếm theo tên, mã số hoặc email"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value.toLowerCase())}
            enterButton
            style={{ width: 250, marginRight: 20 }}
          />
        </div>

        <Tabs defaultActiveKey="1">
          <TabPane
            tab={
              <span>
                Đang chờ xử lý{" "}
                <Badge
                  showZero
                  count={pendingRequests.length}
                  style={{
                    marginTop: -17,
                    right: -1,
                    backgroundColor: "rgb(98, 182, 203)",
                    transform: "scale(0.8)",
                  }}
                />
              </span>
            }
            key="1"
          >
            <Table
              columns={columns(true)} // Show actions for pending requests
              dataSource={pendingRequests}
              loading={loading}
              rowKey={(record) => record._id}
              pagination={{ pageSize: 5 }}
              style={{
                marginTop: 20,
                border: "2px solid rgb(236 236 236)",
                minHeight: "330px",
                marginBottom: 20,
                borderRadius: "10px",
              }}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                Đã xử lý{" "}
                <Badge
                  showZero
                  count={processedRequests.length}
                  style={{
                    marginTop: -17,
                    right: -1,
                    backgroundColor: "rgb(98, 182, 203)",
                    transform: "scale(0.8)",
                  }}
                />
              </span>
            }
            key="2"
          >
            <Table
              columns={columns(false, true)}
              dataSource={processedRequests}
              loading={loading}
              rowKey={(record) => record._id}
              pagination={{ pageSize: 5 }}
              style={{ marginTop: 20 }}
            />
          </TabPane>
        </Tabs>

        {selectedRequest && modalType === "transfer" && (
          <TransferClassModal
            visible={!!selectedRequest}
            onCancel={handleCloseModal}
            student={{
              ...selectedRequest.studentId,
              classId: selectedRequest.currentClassId,
            }}
            targetClassId={selectedRequest.requestedClassId._id}
            currentSemester={currentSemester}
            availableClasses={availableClasses}
            refreshData={fetchTransferRequests}
            requestId={selectedRequest._id}
          />
        )}

        {selectedRequest && modalType === "swap" && (
          <SwapClassModal
            visible={!!selectedRequest}
            onCancel={handleCloseModal}
            student={{
              ...selectedRequest.studentId,
              classId: selectedRequest.currentClassId,
            }}
            targetClassId={selectedRequest.requestedClassId._id}
            currentSemester={currentSemester}
            availableClasses={availableClasses}
            refreshData={fetchTransferRequests}
            requestId={selectedRequest._id}
          />
        )}
      </div>
    </div>
  );
};

export default TransferRequestManagement;
