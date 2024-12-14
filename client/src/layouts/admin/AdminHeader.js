import React, { useEffect, useMemo, useState } from "react";
import { Layout, Menu, message, Modal, Select, Spin } from "antd";
import SubMenu from "antd/es/menu/SubMenu";
import { FaUserCircle } from "react-icons/fa";
import {
  setCounts,
  setDetailSemester,
  setIsChangeSemester,
  setLoading,
  setSemester,
  setSid,
  setUsersInSmt,
} from "../../redux/slice/semesterSlide";
import { setTeacherData } from "../../redux/slice/ClassManagementSlice";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { ImProfile } from "react-icons/im";
import { IoSettingsOutline } from "react-icons/io5";
import { CiLogout } from "react-icons/ci";
import { BellFilled } from "@ant-design/icons";
import { setUserLogin } from "../../redux/slice/UserSlice";
import { setSemesters } from "../../redux/slice/semesterSlide";

const { Header } = Layout;
const { Option } = Select;

const AdminHeader = ({ collapsed, toggleCollapse }) => {
  const navigate = useNavigate();
  const jwt = localStorage.getItem("jwt");
  const dispatch = useDispatch();
  const { semesters, semester, isChangeSemester, currentSemester, sid } =
    useSelector((state) => state.semester);

  const [isLoadingSemesters, setIsLoadingSemesters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const config = useMemo(
    () => ({
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${jwt}`,
      },
    }),
    [jwt]
  );

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userRes = await axios.get(`${BASE_URL}/user/profile`, config);
        dispatch(setUserLogin(userRes.data));
      } catch (error) {
        console.error("Error fetching teacher data:", error);
        message.error("Lỗi khi tải thông tin người dùng.");
      }
    };

    fetchUserData();
  }, []);

  const refreshSemesters = async () => {
    try {
      setIsLoadingSemesters(true);
      const semestersResponse = await axios.get(
        `${BASE_URL}/semester/all`,
        config
      );
      dispatch(setSemesters(semestersResponse.data));
    } catch (error) {
      message.error("Lỗi khi tải danh sách kỳ học.");
      console.error("Error fetching semesters:", error);
    } finally {
      setIsLoadingSemesters(false);
    }
  };

  useEffect(() => {
    if (!semesters || semesters.length === 0) {
      refreshSemesters();
    }
  }, []);

  const handleSemesterChange = async (semesterId) => {
    const selectedSemester = semesters.find(
      (semester) => semester._id === semesterId
    );

    if (!selectedSemester) {
      message.error("Kỳ học không tồn tại.");
      return;
    }

    try {
      dispatch(setLoading(true)); // Hiển thị trạng thái loading
      dispatch(setSemester(selectedSemester)); // Cập nhật thông tin kỳ học
      dispatch(setSid(semesterId)); // Cập nhật ID kỳ học

      // Gọi API để tải chi tiết kỳ học
      const response = await axios.get(
        `${BASE_URL}/semester/${semesterId}/detail`,
        config
      );
      const semesterData = response.data;

      // Cập nhật Redux với thông tin chi tiết kỳ học
      dispatch(
        setCounts({
          studentCount: semesterData.studentCount,
          teacherCount: semesterData.teacherCount,
          mentorCount: semesterData.mentorCount,
          classCount: semesterData.classCount,
          endDate: semesterData.endDate,
          startDate: semesterData.startDate,
          semesterName: semesterData.name,
          status: semesterData.status,
          studentsWithClass: semesterData.studentsWithClass,
          studentsWithoutClass: semesterData.studentsWithoutClass,
          teachersWithClassCount: semesterData.teachersWithClassCount,
          teachersWithoutClassCount: semesterData.teachersWithoutClassCount,
          classesWithStudentsCount: semesterData.classesWithStudentsCount,
          classesWithoutStudentsCount: semesterData.classesWithoutStudentsCount,
        })
      );
      dispatch(
        setDetailSemester({
          classesWithStudentsList: semesterData.details.classesWithStudentsList,
          classesWithoutStudentsList:
            semesterData.details.classesWithoutStudentsList,
          teachersWithClasses: semesterData.details.teachersWithClasses,
          teachersWithoutClasses: semesterData.details.teachersWithoutClasses,
          mentorsWithMatch: semesterData.details.mentorsWithMatch,
          mentorsWithoutMatch: semesterData.details.mentorsWithoutMatch,
        })
      );

      // Tải danh sách người dùng trong kỳ học
      const userResponse = await axios.get(
        `${BASE_URL}/semester/${semesterId}/users`,
        config
      );
      dispatch(setUsersInSmt(userResponse.data));
      dispatch(setIsChangeSemester(true));
    } catch (error) {
      console.error("Error fetching semester detail:", error);
      message.error("Lỗi khi tải thông tin kỳ học.");
    } finally {
      dispatch(setLoading(false)); // Tắt trạng thái loading
    }
  };

  useEffect(() => {
    if (semesters && semesters.length > 0) {
      // Chỉ auto chọn kỳ nếu chưa có sid và không có sự thay đổi kỳ do người dùng
      if (!sid && !isChangeSemester) {
        if (currentSemester && currentSemester._id) {
          handleSemesterChange(currentSemester._id); // Chọn kỳ hiện tại
        } else {
          handleSemesterChange(semesters[0]._id); // Chọn kỳ đầu tiên
        }
      }
    }
  }, [semesters, currentSemester, sid, isChangeSemester]);

  const filteredSemesters = useMemo(() => {
    if (!searchTerm) {
      return semesters;
    }
    return semesters.filter((semester) =>
      semester.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [semesters, searchTerm]);

  const handleLogout = () => {
    navigate("/");
    localStorage.clear();
  };
  const clickLogo = () => {
    navigate("/admin/dashboard");
  };

  const getLastName = (fullName) => {
    if (!fullName || typeof fullName !== "string") {
      return "N/A"; // Trả về mặc định nếu không hợp lệ
    }
    const nameParts = fullName.trim().split(" ");
    return nameParts[nameParts.length - 1]; // Lấy phần cuối của mảng
  };
  return (
    <div className="navbar">
      <div onClick={clickLogo} className="logo">
        <p className="logo-title">EduStart</p>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          position: "absolute",
          left: 269,
          zIndex: 100,
        }}
      >
        <span style={{ fontWeight: "500" }}>Kỳ học:</span>
        <Select
          value={sid} // Sử dụng sid để phản ánh kỳ học được chọn
          onChange={handleSemesterChange}
          style={{ minWidth: "135px" }}
          loading={isLoadingSemesters}
          placeholder="Chọn kỳ học"
          showSearch
          onSearch={(value) => setSearchTerm(value)}
          filterOption={false} // Sử dụng logic lọc của riêng mình
          dropdownStyle={{ maxHeight: 135, overflow: "auto" }}
        >
          {filteredSemesters.map((semester) => {
            // Xác định trạng thái của kỳ học
            const statusColor =
              semester.status === "Ongoing"
                ? "dodgerblue" // Xanh biển
                : semester.status === "Upcoming"
                ? "orange" // Cam
                : "gray"; // Xám

            // Kiểm tra xem có phải kỳ hiện tại hay không
            const isCurrentSemester = semester._id === currentSemester?._id;

            return (
              <Option key={semester._id} value={semester._id}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {/* Badge tròn nhỏ */}
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: statusColor,
                      display: "inline-block",
                      marginRight: "8px",
                    }}
                  />
                  {/* Tên kỳ học */}
                  <span>
                    {semester.name}{" "}
                    {isCurrentSemester && (
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: "bold",
                          color: "dodgerblue",
                          marginLeft: "8px",
                        }}
                      >
                        (Kỳ hiện tại)
                      </span>
                    )}
                  </span>
                </div>
              </Option>
            );
          })}
        </Select>

        {isLoadingSemesters && <Spin size="small" />}
      </div>
      <Menu mode="horizontal" className="menu" style={{ height: "100%" }}>
        <div>
          <SubMenu
            key="sub1"
            title={
              <div
                style={{
                  height: "100%",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  margin: "0.6rem",
                }}
              >
                <FaUserCircle
                  style={{ fontSize: "2rem", marginRight: "1rem" }}
                  className="user-circle-icon"
                />
                <span style={{ lineHeight: "1rem" }}>
                  Xin chào! <br /> Quản trị viên
                </span>
              </div>
            }
            style={{ margin: "0px", padding: "0px" }}
          >
            <Menu.Item
              key="1"
              icon={
                <ImProfile className={toggleCollapse ? "" : "custom-icon"} />
              }
            >
              <Link style={{ textDecoration: "none" }} to="/admin/profile">
                Thông tin của bạn
              </Link>
            </Menu.Item>
            <Menu.Item
              key="2"
              icon={
                <IoSettingsOutline
                  className={toggleCollapse ? "" : "custom-icon"}
                />
              }
            >
              Cài đặt
            </Menu.Item>
            <Menu.Item
              key="3"
              icon={
                <CiLogout
                  className={toggleCollapse ? "" : "custom-icon"}
                  onClick={handleLogout}
                />
              }
              onClick={handleLogout}
            >
              <span style={{ cursor: "pointer" }}>Đăng xuất</span>
            </Menu.Item>
          </SubMenu>
          <Menu.Item key="4">
            <Link style={{ textDecoration: "none" }} to="/contact">
              <BellFilled
                style={{ fontSize: "1.5rem" }}
                className="bell-icon"
              />
            </Link>
          </Menu.Item>
        </div>
      </Menu>
    </div>
  );
};

export default AdminHeader;
