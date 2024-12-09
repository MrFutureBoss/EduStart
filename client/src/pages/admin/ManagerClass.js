import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Layout,
  Row,
  Col,
  Card,
  List,
  Button,
  Select,
  Modal,
  Alert,
  Tooltip,
  Empty,
  Spin,
  Pagination,
  Form,
  Input,
  message,
  Badge,
  Menu,
  Dropdown,
  Image,
  Statistic,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  TeamOutlined,
  UserOutlined,
  SolutionOutlined,
  CheckOutlined,
  IssuesCloseOutlined,
  UpCircleOutlined,
} from "@ant-design/icons";
import Search from "antd/es/input/Search";
import ConfirmButton from "../../components/Button/ConfirmButton";
import "../../style/Admin/ManagerClass.css";
import {
  setIsChangeSemester,
  setPendingUsers,
  setSid,
} from "../../redux/slice/semesterSlide";
import { BASE_URL } from "../../utilities/initalValue";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import CustomButton from "../../components/Button/Button";
import CancelButton from "../../components/Button/CancelButton";
import SwapClassModal from "../semester/userModel/SwapClassModal";
import TransferClassModal from "../semester/userModel/TransferClassModal";
import {
  setClasses,
  setUnassignedStudents,
} from "../../redux/slice/ClassManagementSlice";
import SmallModal from "../../components/Modal/SmallModal";

const { Content } = Layout;
const { Option } = Select;

const ClassManager = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [selectedDropdown, setSelectedDropdown] = useState(null);
  const [swappedStudents, setSwappedStudents] = useState([]);
  const jwt = localStorage.getItem("jwt");
  const navigate = useNavigate();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [swapModalVisible, setSwapModalVisible] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false); // Trạng thái đang tải dữ liệu
  const config = useMemo(
    () => ({
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${jwt}`,
      },
    }),
    [jwt]
  );

  const { currentSemester, sid, semester, isChangeSemester } = useSelector(
    (state) => state.semester
  );
  const { classes, unassignedStudents } = useSelector(
    (state) => state.classManagement
  );
  console.log("semester", semester);

  const handleStudentAction = (action, student) => {
    setSelectedStudent(student);
    if (action === "transfer") {
      setTransferModalVisible(true);
    } else if (action === "swap") {
      setSwapModalVisible(true);
    }
  };
  // State quản lý loading và error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State quản lý bộ lọc và tìm kiếm
  const [filter, setFilter] = useState("all");
  const [searchValue, setSearchValue] = useState("");

  // State quản lý phân trang cho lớp và sinh viên
  const [currentClassPage, setCurrentClassPage] = useState(1);
  const classesPerPage = 6;
  const [currentStudentPage, setCurrentStudentPage] = useState(1);
  const studentsPerPage = 18;

  // State và hàm quản lý tạo lớp mới
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [teachersList, setTeachersList] = useState([]);
  const [form] = Form.useForm();
  const [isModal, setIsModal] = useState(false);

  // State để kiểm soát việc gợi ý sinh viên
  const [suggestionTriggered, setSuggestionTriggered] = useState(false);

  // State để lưu danh sách lớp và sinh viên khớp với tìm kiếm
  const [matchedClasses, setMatchedClasses] = useState([]);
  const [matchedStudents, setMatchedStudents] = useState([]);
  const [matchedUnassignedStudents, setMatchedUnassignedStudents] = useState(
    []
  );

  // Hàm để in đậm và tô màu phần trùng khớp
  const highlightText = (text, query) => {
    if (!query) return text;

    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} style={{ fontWeight: "bold", color: "red" }}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Hàm để lấy danh sách giáo viên
  const fetchTeachersOtherSemeter = useCallback(async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/admins/teachers-list/${sid}`,
        config
      );
      setTeachersList(response.data.teachers);
    } catch (error) {
      message.error("Lỗi khi lấy danh sách giáo viên.");
      console.error("Error fetching teachers:", error);
    }
  }, [config, sid]);

  // Gọi API để lấy danh sách lớp học
  const fetchClasses = useCallback(async () => {
    if (!currentSemester || !currentSemester._id) return;

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${BASE_URL}/class/all-class/${sid}`,
        config
      );

      // Map dữ liệu từ API vào cấu trúc mà component sử dụng
      const fetchedClasses = response.data.map((cls) => ({
        _id: cls._id,
        username: cls.className,
        teacher: cls.teacherName || "Chưa có",
        limit: cls.limitStudent,
        studentCount: cls.students.length, // Sửa lỗi: sử dụng độ dài mảng students
        students: cls.students || [], // Thêm danh sách sinh viên đã phân vào lớp
        suggestedStudents: [], // Đảm bảo có mảng suggestedStudents
      }));

      dispatch(setClasses(fetchedClasses));
      setSuggestionTriggered(false); // Reset flag để gợi ý lại nếu cần
    } catch (err) {
      console.error("Error fetching classes:", err);
      setError("Không thể tải danh sách lớp học.");
    } finally {
      setLoading(false);
    }
  }, [currentSemester, config, sid]);
  console.log("sid", sid);

  // Gọi API để lấy danh sách sinh viên chưa có lớp
  const fetchPendingUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!sid) {
        const semesterData = await axios.get(
          `${BASE_URL}/semester/current`,
          config
        );
        const semester = semesterData.data;
        dispatch(setSid(semester._id));
        const response = await axios.get(
          `${BASE_URL}/admins/pending-user/${semester._id}`,
          config
        );

        dispatch(setPendingUsers(response.data.pendingUsers));
        dispatch(setUnassignedStudents(response.data.pendingUsers));
        setSuggestionTriggered(false);
      } else {
        const response = await axios.get(
          `${BASE_URL}/admins/pending-user/${sid}`,
          config
        );

        dispatch(setPendingUsers(response.data.pendingUsers));
        dispatch(setUnassignedStudents(response.data.pendingUsers));
        setSuggestionTriggered(false); // Reset flag để gợi ý lại nếu cần
      }
    } catch (err) {
      console.error("Error fetching pending users:", err);
      setError("Không thể tải danh sách sinh viên chưa có lớp.");
    } finally {
      setLoading(false);
    }
  }, [dispatch, config, sid]);

  // Gọi API để lấy danh sách giáo viên khi component mount hoặc khi config thay đổi
  useEffect(() => {
    fetchClasses(); // Gọi một lần duy nhất khi component mount
  }, [fetchClasses]);

  useEffect(() => {
    if (sid) {
      fetchPendingUsers(); // Gọi API lấy danh sách giáo viên
      fetchClasses(); // Gọi API lấy danh sách lớp học
      fetchTeachersOtherSemeter();
    }
  }, [sid, fetchTeachersOtherSemeter, fetchClasses]);

  useEffect(() => {
    fetchPendingUsers(); // Gọi lại API khi `sid` thay đổi
  }, [fetchPendingUsers]);

  // Tự động gợi ý sinh viên vào các lớp còn chỗ trống dựa trên studentCount và limitStudent
  const handleSuggestion = async () => {
    if (!currentSemester || !currentSemester._id) {
      message.error("Không tìm thấy kỳ học hiện tại.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Tạo bản sao của các lớp để cập nhật gợi ý
      let newClasses = classes.map((classItem) => ({
        ...classItem,
        suggestedStudents: [...classItem.suggestedStudents],
      }));

      let remainingUnassignedStudents = [...unassignedStudents];

      // Gợi ý sinh viên cho từng lớp
      newClasses.forEach((classItem) => {
        if (
          classItem.suggestedStudents.length === 0 &&
          classItem.studentCount < classItem.limit
        ) {
          const remainingCapacity =
            classItem.limit -
            classItem.studentCount -
            classItem.suggestedStudents.length;

          const numberToAssign = Math.min(
            remainingCapacity,
            remainingUnassignedStudents.length
          );

          for (let i = 0; i < numberToAssign; i++) {
            const student = remainingUnassignedStudents.shift();
            if (student) {
              classItem.suggestedStudents.push(student);
            }
          }
        }
      });

      // Cập nhật lại state
      dispatch(setClasses(newClasses));
      dispatch(setUnassignedStudents(remainingUnassignedStudents));
      setSuggestionTriggered(true); // Đánh dấu đã gợi ý

      message.success("Đã gợi ý sinh viên vào các lớp thành công.");
    } catch (err) {
      console.error("Error during suggestion:", err);
      setError("Có lỗi xảy ra khi gợi ý sinh viên vào các lớp.");
      Modal.error({
        title: "Lỗi",
        content: "Không thể gợi ý sinh viên vào các lớp.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Hàm tính toán tăng giới hạn cho các lớp
  const handleIncreaseClassLimit = () => {
    const totalUnassigned = unassignedStudents.length;
    const classesCount = classes.length;

    if (totalUnassigned > 0) {
      const additionalStudentsPerClass = Math.ceil(
        totalUnassigned / classesCount
      );

      Modal.confirm({
        title: "Tăng giới hạn sinh viên trong lớp",
        content: `Có tổng cộng ${totalUnassigned} sinh viên chưa có lớp. Sẽ tăng giới hạn cho mỗi lớp thêm ${additionalStudentsPerClass} sinh viên để phân bổ đủ sinh viên còn lại.`,
        onOk: async () => {
          try {
            const updatedClasses = classes.map((classItem) => {
              const currentTotalStudents =
                classItem.studentCount + classItem.suggestedStudents.length;
              const requiredLimit =
                currentTotalStudents + additionalStudentsPerClass;
              const newLimit = Math.max(classItem.limit, requiredLimit);

              return {
                ...classItem,
                limit: newLimit,
              };
            });

            dispatch(setClasses(updatedClasses));

            // Gợi ý lại danh sách sinh viên chưa có lớp dựa trên các lớp còn chỗ trống
            let newClasses = updatedClasses.map((classItem) => ({
              ...classItem,
              suggestedStudents: [...classItem.suggestedStudents],
            }));
            let remainingUnassignedStudents = [...unassignedStudents];

            newClasses.forEach((classItem) => {
              const remainingCapacity =
                classItem.limit -
                classItem.studentCount -
                classItem.suggestedStudents.length;
              const numberToAssign = Math.min(
                remainingCapacity,
                remainingUnassignedStudents.length
              );

              for (let i = 0; i < numberToAssign; i++) {
                const student = remainingUnassignedStudents.shift();
                if (student) {
                  classItem.suggestedStudents.push(student);
                }
              }
            });

            dispatch(setClasses(newClasses));
            dispatch(setUnassignedStudents(remainingUnassignedStudents));
            setSuggestionTriggered(true); // Đánh dấu đã gợi ý
          } catch (err) {
            console.error("Error increasing class limit:", err);
            Modal.error({
              title: "Lỗi",
              content: "Không thể tăng giới hạn lớp học.",
            });
          }
        },
      });
    }
  };

  // Hàm thêm sinh viên vào lớp từ danh sách chưa có lớp
  const addStudentToClass = async (classId, student) => {
    const selectedClassData = classes.find(
      (classItem) => classItem._id === classId
    );

    if (!selectedClassData) {
      message.error("Không tìm thấy lớp để thêm sinh viên.");
      return;
    }

    const classLimit = selectedClassData.limit;
    const studentCount = selectedClassData.studentCount;
    const suggestedCount = selectedClassData.suggestedStudents.length;
    const totalStudents = studentCount + suggestedCount;

    if (studentCount >= classLimit && suggestedCount === 0) {
      // Trường hợp 1: Lớp đã đạt giới hạn và không có sinh viên gợi ý
      Modal.confirm({
        title: "Lớp đã đạt giới hạn sinh viên",
        content: `Lớp ${selectedClassData.username} đã đạt giới hạn ${classLimit} sinh viên. Bạn có muốn thêm sinh viên này vào lớp không?`,
        onOk: async () => {
          await handleAssignStudent(classId, student);
        },
      });
    } else if (totalStudents >= classLimit && suggestedCount > 0) {
      // Trường hợp 2: Lớp đã đầy bao gồm cả sinh viên gợi ý
      Modal.confirm({
        title: "Lớp đã đủ số lượng sinh viên",
        content: `Lớp ${selectedClassData.username} đã đủ ${classLimit} sinh viên bao gồm cả sinh viên gợi ý. Khi thêm sinh viên này, một sinh viên từ danh sách gợi ý sẽ được trả về danh sách chưa có lớp. Bạn có muốn thực hiện không?`,
        onOk: async () => {
          await handleAssignStudentAndReplaceSuggested(classId, student);
        },
      });
    } else {
      // Lớp chưa đầy
      Modal.confirm({
        title: "Xác nhận thêm sinh viên vào lớp",
        content: `Bạn có chắc chắn muốn thêm sinh viên ${student.username} vào lớp ${selectedClassData.username}?`,
        onOk: async () => {
          await handleAssignStudent(classId, student);
        },
      });
    }
  };

  const handleAssignStudent = async (classId, student) => {
    setLoading(true);
    setError(null);
    try {
      // Gọi API để phân bổ sinh viên vào lớp
      await axios.post(
        `${BASE_URL}/admins/assign/student`,
        {
          userId: student._id,
          classId: classId,
        },
        config
      );

      // Cập nhật state classes
      const updatedClasses = classes.map((classItem) => {
        if (classItem._id === classId) {
          return {
            ...classItem,
            studentCount: classItem.studentCount + 1,
            students: [...classItem.students, student],
          };
        }
        return classItem;
      });

      dispatch(setClasses(updatedClasses));

      // Cập nhật unassignedStudents
      const updatedUnassignedStudents =
        unassignedStudents?.filter((s) => s._id !== student._id) || [];

      dispatch(setUnassignedStudents(updatedUnassignedStudents));

      message.success(`Đã thêm sinh viên ${student.username} vào lớp.`);
    } catch (err) {
      console.error("Error assigning student:", err);
      setError("Có lỗi xảy ra khi thêm sinh viên vào lớp.");
      Modal.error({
        title: "Lỗi",
        content: "Không thể thêm sinh viên vào lớp.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignStudentAndReplaceSuggested = async (classId, student) => {
    setLoading(true);
    setError(null);
    try {
      // Gọi API để phân bổ sinh viên vào lớp
      await axios.post(
        `${BASE_URL}/admins/assign/student`,
        {
          userId: student._id,
          classId: classId,
        },
        config
      );

      // Loại bỏ một sinh viên từ suggestedStudents
      let studentToRemove = null;
      const updatedClasses = classes.map((classItem) => {
        if (classItem._id === classId) {
          const newSuggestedStudents = [...classItem.suggestedStudents];
          if (newSuggestedStudents.length > 0) {
            studentToRemove = newSuggestedStudents.shift(); // Lấy sinh viên đầu tiên để loại bỏ
          }
          return {
            ...classItem,
            studentCount: classItem.studentCount + 1,
            students: [...classItem.students, student],
            suggestedStudents: newSuggestedStudents,
          };
        }
        return classItem;
      });

      // Cập nhật danh sách lớp trong Redux
      dispatch(setClasses(updatedClasses));

      // Xử lý cập nhật unassignedStudents
      const prevUnassigned = [...unassignedStudents];

      // Nếu có sinh viên bị loại bỏ, thêm lại vào danh sách unassignedStudents
      if (studentToRemove) {
        prevUnassigned.push(studentToRemove);
      }

      // Loại bỏ sinh viên mới được thêm vào lớp khỏi unassignedStudents
      const updatedUnassigned = prevUnassigned.filter(
        (s) => s._id !== student._id
      );

      // Cập nhật unassignedStudents trong Redux
      dispatch(setUnassignedStudents(updatedUnassigned));

      message.success(
        `Đã thêm sinh viên ${student.username} vào lớp và trả một sinh viên gợi ý về danh sách chưa có lớp.`
      );
    } catch (err) {
      console.error("Error assigning student:", err);
      setError("Có lỗi xảy ra khi thêm sinh viên vào lớp.");
      Modal.error({
        title: "Lỗi",
        content: "Không thể thêm sinh viên vào lớp.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Hàm lưu tất cả sinh viên gợi ý vào lớp cho từng lớp riêng biệt
  const handleSaveClass = async (classId) => {
    const classItem = classes.find((c) => c._id === classId);
    if (!classItem) return;

    if (classItem.suggestedStudents.length === 0) return;

    Modal.confirm({
      title: "Xác nhận lưu phân bổ",
      content: `Bạn có chắc chắn muốn lưu ${classItem.suggestedStudents.length} sinh viên vào lớp ${classItem.username}?`,
      onOk: async () => {
        setLoading(true);
        setError(null);
        try {
          // Gọi API để phân bổ từng sinh viên vào lớp
          const assignPromises = classItem.suggestedStudents.map((student) =>
            axios.post(
              `${BASE_URL}/admins/assign/student`,
              {
                userId: student._id,
                classId: classId,
              },
              config
            )
          );

          await Promise.all(assignPromises);

          // Sau khi phân bổ thành công, cập nhật state
          const updatedClasses = classes.map((classItem) => {
            if (classItem._id === classId) {
              return {
                ...classItem,
                studentCount:
                  classItem.studentCount + classItem.suggestedStudents.length,
                suggestedStudents: [],
              };
            }
            return classItem;
          });

          dispatch(setClasses(updatedClasses));

          // Cập nhật danh sách sinh viên chưa có lớp bằng cách loại bỏ các sinh viên đã được phân bổ
          dispatch(
            setUnassignedStudents((prevUnassigned) =>
              prevUnassigned.filter(
                (student) =>
                  !classItem.suggestedStudents.find(
                    (s) => s._id === student._id
                  )
              )
            )
          );

          message.success(
            `Đã phân bổ thành công ${classItem.suggestedStudents.length} sinh viên vào lớp ${classItem.username}.`
          );

          setSuggestionTriggered(false); // Đánh dấu đã gợi ý
        } catch (err) {
          console.error("Error assigning students:", err);
          setError("Có lỗi xảy ra khi phân bổ sinh viên vào lớp.");
          Modal.error({
            title: "Lỗi",
            content: "Không thể phân bổ sinh viên vào lớp.",
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Hàm để mở modal tạo lớp mới
  const showCreateClassModal = () => {
    setIsModalVisible(true);
  };

  // Hàm để đóng modal tạo lớp mới
  const handleCancelCreateClass = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  // Hàm để tạo lớp mới
  const handleCreateClass = async () => {
    try {
      const values = await form.validateFields();

      if (
        !values.newClasses ||
        !Array.isArray(values.newClasses) ||
        values.newClasses.length === 0
      ) {
        throw new Error("Không có dữ liệu lớp mới để tạo.");
      }

      setLoading(true); // Bắt đầu trạng thái tạo lớp

      // Gọi API để tạo lớp mới
      const createClassPromises = values.newClasses.map((cls) =>
        axios.post(
          `${BASE_URL}/admins/create-class`,
          {
            semesterId: sid,
            className: cls.className,
            teacherId: cls.teacherId,
            limitStudent: cls.limitStudent || 30,
          },
          config
        )
      );

      const results = await Promise.allSettled(createClassPromises);

      // Xử lý kết quả từ Promise.allSettled
      const errors = results
        .map((result, index) => {
          if (result.status === "rejected") {
            const errorResponse = result.reason.response?.data || {};
            return { ...errorResponse, index }; // Gắn thêm index để xác định vị trí lớp bị lỗi
          }
          return null;
        })
        .filter((error) => error !== null);

      if (errors.length > 0) {
        // Nếu có lỗi, áp dụng lỗi vào các trường tương ứng trên form
        errors.forEach((error) => {
          console.log(error.message);

          if (error.field) {
            form.setFields([
              {
                name: ["newClasses", error.index, error.field],
                errors: [error.message],
              },
            ]);
          }
        });
        throw new Error(`Có lỗi xảy ra khi tạo lớp mới.${errors}`);
      }

      message.success("Tạo lớp mới thành công.");

      // Cập nhật trạng thái tải dữ liệu trước khi làm mới danh sách
      setIsDataLoading(true);

      await fetchClasses(); // Cập nhật danh sách lớp

      // Đánh dấu tải dữ liệu xong
      setIsDataLoading(false);

      // Đóng modal và reset form
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error("Error in handleCreateClass:", error);
      setIsDataLoading(false); // Đảm bảo trạng thái tải dữ liệu được reset
    } finally {
      setLoading(false); // Kết thúc trạng thái tạo lớp
    }
  };

  // Gợi ý thêm lớp hoặc tăng số lượng thành viên trong lớp
  const renderSuggestions = () => {
    const totalUnassigned = unassignedStudents.length;
    const areAllClassesFull = classes.every(
      (classItem) =>
        classItem.studentCount + classItem.suggestedStudents.length >=
        classItem.limit
    );

    // Luôn hiển thị thông báo gợi ý
    if (totalUnassigned >= 20 && semester.status !== "Finished") {
      // Nếu tất cả các lớp đã đầy và còn sinh viên chưa có lớp
      return (
        <Alert
          message="Đề xuất: Thêm lớp học mới"
          description={
            <div>
              Tất cả các lớp hiện tại đã đầy và có {totalUnassigned} sinh viên
              chưa có lớp. Hãy xem xét tạo thêm lớp học mới.{" "}
              <div style={{ marginTop: "16px" }}>
                <CustomButton
                  icon={<PlusOutlined />}
                  content={" Tạo Lớp Mới"}
                  onClick={showCreateClassModal}
                />
              </div>
            </div>
          }
          type="warning"
          showIcon
          style={{ marginTop: "16px" }}
        />
      );
    } else if (
      totalUnassigned > 0 &&
      totalUnassigned < 20 &&
      semester.status !== "Finished"
    ) {
      // Nếu còn sinh viên chưa có lớp
      return (
        <Alert
          message="Đề xuất: Tăng giới hạn của lớp"
          description={
            <div>
              Có {totalUnassigned} sinh viên chưa được phân bổ vào lớp. Hãy tăng
              giới hạn của lớp.
              <div style={{ marginTop: "16px" }}>
                <CustomButton
                  content="  Tăng Giới Hạn Lớp"
                  onClick={handleIncreaseClassLimit}
                  icon={<UpCircleOutlined />}
                />
              </div>
            </div>
          }
          type="warning"
          showIcon
          style={{ marginTop: "16px" }}
        />
      );
    }
    return null;
  };

  // Xử lý chuyển lớp sinh viên với hiệu ứng highlight
  const handleSwitchClass = (currentClassId, student, targetClassId) => {
    const currentClass = classes.find(
      (classItem) => classItem._id === currentClassId
    );
    const targetClass = classes.find(
      (classItem) => classItem._id === targetClassId
    );

    if (!targetClass) {
      alert("Lớp đích không tồn tại.");
      return;
    }

    const targetRemainingCapacity =
      targetClass.limit -
      targetClass.studentCount -
      targetClass.suggestedStudents.length;

    if (targetRemainingCapacity <= 0) {
      Modal.confirm({
        title: "Lớp đã đầy",
        content: `Lớp ${targetClass.username} đã đầy. Bạn có muốn hoán đổi sinh viên này với một sinh viên khác trong lớp đích không?`,
        onOk: () => {
          // Kiểm tra xem lớp đích có sinh viên nào trong suggestedStudents không
          if (targetClass.suggestedStudents.length === 0) {
            message.error("Không có sinh viên nào để hoán đổi trong lớp đích.");
            return;
          }

          const swappedStudent = targetClass.suggestedStudents.shift(); // Lấy sinh viên đầu tiên để hoán đổi
          currentClass.suggestedStudents.push(swappedStudent); // Thêm sinh viên đã hoán đổi vào lớp hiện tại

          // Cập nhật suggestedStudents của cả hai lớp
          currentClass.suggestedStudents =
            currentClass.suggestedStudents.filter((s) => s._id !== student._id);
          targetClass.suggestedStudents.push(student);

          // Cập nhật state classes
          const updatedClasses = classes.map((classItem) => {
            if (classItem._id === currentClassId) {
              return {
                ...classItem,
                suggestedStudents: currentClass.suggestedStudents,
              };
            }
            if (classItem._id === targetClassId) {
              return {
                ...classItem,
                suggestedStudents: targetClass.suggestedStudents,
              };
            }
            return classItem;
          });

          dispatch(setClasses(updatedClasses));

          // Thêm các sinh viên đã hoán đổi vào state để highlight
          setSwappedStudents([swappedStudent._id, student._id]);

          // Loại bỏ highlight sau 5 giây
          setTimeout(() => {
            setSwappedStudents([]);
          }, 5000);

          setSelectedDropdown(null); // Đóng dropdown
        },
        onCancel: () => setSelectedDropdown(null),
      });
    } else {
      // Lớp chưa đầy, thêm sinh viên vào lớp đích
      currentClass.suggestedStudents = currentClass.suggestedStudents.filter(
        (s) => s._id !== student._id
      );
      targetClass.suggestedStudents.push(student);

      // Cập nhật state classes
      const updatedClasses = classes.map((classItem) => {
        if (classItem._id === currentClassId) {
          return {
            ...classItem,
            suggestedStudents: currentClass.suggestedStudents,
          };
        }
        if (classItem._id === targetClassId) {
          return {
            ...classItem,
            suggestedStudents: targetClass.suggestedStudents,
          };
        }
        return classItem;
      });

      dispatch(setClasses(updatedClasses));

      // Thêm sinh viên vào state để highlight
      setSwappedStudents([student._id]);

      // Loại bỏ highlight sau 5 giây
      setTimeout(() => {
        setSwappedStudents([]);
      }, 5000);

      setSelectedDropdown(null); // Đóng dropdown
    }
  };

  // Hàm tìm kiếm
  const handleSearch = (value) => {
    const query = value.toLowerCase();
    setSearchValue(query);

    // Tìm kiếm trong unassignedStudents
    const matchedUnassigned = unassignedStudents.filter(
      (student) =>
        (student.username && student.username.toLowerCase().includes(query)) ||
        (student.rollNumber && student.rollNumber.toLowerCase().includes(query))
    );

    setMatchedUnassignedStudents(matchedUnassigned.map((s) => s._id));

    // Tìm kiếm trong classes và students
    const matchedClassIds = [];
    const matchedStudentIds = [];

    classes.forEach((classItem) => {
      const matchedInClass = classItem.students.filter(
        (student) =>
          (student.username &&
            student.username.toLowerCase().includes(query)) ||
          (student.rollNumber &&
            student.rollNumber.toLowerCase().includes(query))
      );

      if (
        matchedInClass.length > 0 ||
        classItem.username.toLowerCase().includes(query) ||
        classItem.teacher.toLowerCase().includes(query)
      ) {
        matchedClassIds.push(classItem._id);
        matchedStudentIds.push(...matchedInClass.map((s) => s._id));
      }
    });

    setMatchedClasses(matchedClassIds);
    setMatchedStudents(matchedStudentIds);
  };

  useEffect(() => {
    if (location.state?.filter) {
      setFilter(location.state.filter); // Lấy filter từ state truyền vào
    }
  }, [location.state]);

  // Phân trang danh sách lớp
  const indexOfLastClass = currentClassPage * classesPerPage;
  const indexOfFirstClass = indexOfLastClass - classesPerPage;
  const currentClassesForPagination = classes
    .filter((classItem) => {
      if (!searchValue) return true;

      // Tìm kiếm theo tên lớp, giáo viên hoặc sinh viên trong lớp
      const isMatchedClass =
        classItem.username.toLowerCase().includes(searchValue) ||
        classItem.teacher.toLowerCase().includes(searchValue) ||
        classItem.students.some(
          (student) =>
            (student.username &&
              student.username.toLowerCase().includes(searchValue)) ||
            (student.rollNumber &&
              student.rollNumber.toLowerCase().includes(searchValue))
        );

      return isMatchedClass;
    })
    .filter((classItem) => {
      if (filter === "all") return true;
      if (filter === "full") return classItem.studentCount >= classItem.limit;
      if (filter === "noTeacher")
        return !classItem.teacher || classItem.teacher === "Chưa có";
      if (filter === "notFull") return classItem.studentCount < classItem.limit;
      return true;
    })
    .slice(indexOfFirstClass, indexOfLastClass);

  const handleClassPageChange = (page) => {
    setCurrentClassPage(page);
  };

  // Phân Trang Danh Sách Sinh Viên Chưa Có Lớp
  const indexOfLastStudent = currentStudentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;

  const handleStudentPageChange = (page) => {
    setCurrentStudentPage(page);
  };
  console.log("unassignedStudents", unassignedStudents);

  const filteredUnassignedStudents = (
    Array.isArray(unassignedStudents) ? unassignedStudents : []
  ).filter(
    (student) =>
      (student.username &&
        student.username.toLowerCase().includes(searchValue)) ||
      (student.rollNumber &&
        student.rollNumber.toLowerCase().includes(searchValue))
  );

  const currentUnassignedStudents = filteredUnassignedStudents.slice(
    indexOfFirstStudent,
    indexOfLastStudent
  );

  // Hàm phụ để lấy các lớp có chỗ trống và không phải là lớp hiện tại
  const getAvailableClassesForSwap = (currentClassId) => {
    return classes.filter(
      (classItem) =>
        classItem.studentCount < classItem.limit &&
        classItem._id !== currentClassId
    );
  };
  const showSuggestionModal = () => {
    Modal.confirm({
      title: "Xác nhận gợi ý sinh viên vào các lớp",
      content: `Bạn có chắc chắn muốn gợi ý ${unassignedStudents.length} sinh viên chưa có lớp vào các lớp còn chỗ trống? Sau khi chấp nhận thì các sinh viên chưa có lớp sẽ được gợi ý vào các lớp còn trống.`,
      onOk: handleSuggestion, // Hàm thực hiện gợi ý
      onCancel: () => {},
      okText: "Xác nhận",
      cancelText: "Hủy",
    });
  };
  const areAllClassesFull = classes.every(
    (classItem) =>
      classItem.studentCount + classItem.suggestedStudents.length >=
      classItem.limit
  );

  return (
    <Layout>
      <Content style={{ marginTop: "24px" }}>
        <Row
          gutter={[16, 16]}
          style={{ marginBottom: "16px", backgroundColor: "rgb(238 238 238)" }}
        >
          <Col
            style={{
              backgroundColor: "rgb(238 238 238)",
              padding: 9,
              marginTop: -18,
            }}
            span={24}
          >
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Card
                  bodyStyle={{ padding: "8px" }}
                  style={{
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <TeamOutlined
                      style={{
                        fontSize: "18px",
                        color: "#3f8600",
                        marginRight: "8px",
                      }}
                    />
                    <span style={{ fontSize: "14px", fontWeight: "500" }}>
                      Tổng số lớp học:
                    </span>
                    <span
                      style={{
                        fontSize: "16px",
                        color: "#3f8600",
                        marginLeft: 5,
                      }}
                    >
                      {classes.length}
                    </span>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card
                  bodyStyle={{ padding: "8px" }}
                  style={{
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <UserOutlined
                      style={{
                        fontSize: "18px",
                        color: "#cf1322",
                        marginRight: "8px",
                      }}
                    />
                    <span style={{ fontSize: "14px", fontWeight: "500" }}>
                      Sinh viên chưa có lớp:
                    </span>
                    <span
                      style={{
                        fontSize: "16px",
                        color: "#cf1322",
                        marginLeft: 5,
                      }}
                    >
                      {unassignedStudents.length}
                    </span>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card
                  bodyStyle={{ padding: "8px" }}
                  style={{
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <SolutionOutlined
                      style={{
                        fontSize: "18px",
                        color: "#1890ff",
                        marginRight: "8px",
                      }}
                    />
                    <span style={{ fontSize: "14px", fontWeight: "500" }}>
                      Sinh viên đã được gợi ý:
                    </span>
                    <span
                      style={{
                        fontSize: "16px",
                        color: "#1890ff",
                        marginLeft: 5,
                      }}
                    >
                      {classes.reduce(
                        (total, classItem) =>
                          total + classItem.suggestedStudents.length,
                        0
                      )}
                    </span>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card
                  bodyStyle={{ padding: "8px" }}
                  style={{
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <IssuesCloseOutlined
                      style={{
                        fontSize: "18px",
                        color: "#faad14",
                        marginRight: "8px",
                      }}
                    />
                    <span style={{ fontSize: "14px", fontWeight: "500" }}>
                      Lớp chưa đủ sinh viên:
                    </span>
                    <span
                      style={{
                        fontSize: "16px",
                        color: "#faad14",
                        marginLeft: 5,
                      }}
                    >
                      {
                        classes.filter(
                          (classItem) =>
                            classItem.studentCount < classItem.limit
                        ).length
                      }
                    </span>
                  </div>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>

        {/* Header với bộ lọc và tìm kiếm */}
        <Row gutter={[16, 16]} style={{ marginBottom: "16px" }}>
          <Col span={24}>
            <Row align="middle" gutter={[16, 16]}>
              <Col>
                <Select
                  value={filter}
                  onChange={(value) => setFilter(value)}
                  style={{ width: 250 }}
                  placeholder="Chọn bộ lọc"
                >
                  <Option value="all">Tất cả lớp ({classes.length})</Option>
                  <Option value="full">
                    Lớp đã đủ sinh viên (
                    {
                      classes.filter(
                        (classItem) => classItem.studentCount >= classItem.limit
                      ).length
                    }
                    )
                  </Option>
                  <Option value="noTeacher">
                    Lớp chưa có giáo viên (
                    {
                      classes.filter(
                        (classItem) =>
                          !classItem.teacher || classItem.teacher === "Chưa có"
                      ).length
                    }
                    )
                  </Option>
                  <Option value="notFull">
                    Lớp chưa đủ sinh viên (
                    {
                      classes.filter(
                        (classItem) => classItem.studentCount < classItem.limit
                      ).length
                    }
                    )
                  </Option>
                </Select>
              </Col>
              <Col>
                <Search
                  placeholder="Tìm kiếm theo tên lớp, giáo viên hoặc sinh viên"
                  value={searchValue}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{ width: 400 }}
                />
              </Col>
              <Col>
                {semester.status !== "Finished" && (
                  <CustomButton
                    style={{ marginRight: 20 }}
                    content={" Tạo Lớp"}
                    icon={<PlusOutlined />}
                    onClick={showCreateClassModal}
                  />
                )}

                {!areAllClassesFull &&
                  unassignedStudents.length !== 0 &&
                  semester.status !== "Finished" && (
                    <>
                      <CustomButton
                        style={{ marginRight: 20 }}
                        content={"  Gợi Ý Xếp Lớp"}
                        icon={<SolutionOutlined />}
                        onClick={showSuggestionModal}
                      />
                    </>
                  )}
                {unassignedStudents.length !== 0 &&
                  semester.status !== "Finished" && (
                    <CustomButton
                      style={{ marginRight: 20 }}
                      content={"  Tăng Giới Hạn Lớp"}
                      icon={<UpCircleOutlined />}
                      onClick={handleIncreaseClassLimit}
                    />
                  )}
              </Col>
            </Row>
          </Col>
        </Row>

        {/* Danh sách lớp */}
        <Row gutter={[16, 16]}>
          {/* Hiển thị gợi ý nếu có */}
          {renderSuggestions()}
          <Col span={18}>
            <h5>Danh sách lớp</h5>
            {loading ? (
              <Spin tip="Đang tải..." />
            ) : error ? (
              <Alert message="Lỗi" description={error} type="error" showIcon />
            ) : currentClassesForPagination.length > 0 ? (
              <>
                <Row gutter={[16, 16]}>
                  {currentClassesForPagination.map((classItem) => (
                    <Col span={8} key={classItem._id}>
                      <Card
                        className="class-manager-card"
                        style={{
                          borderRadius: "8px",
                          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                          height: 355,
                          border:
                            matchedClasses.includes(classItem._id) &&
                            searchValue
                              ? "2px solid red"
                              : "none",
                        }}
                        title={
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <div>
                              {highlightText(classItem.username, searchValue)}
                              <br />
                              <p style={{ fontSize: "13px", marginBottom: 2 }}>
                                Giáo viên:{" "}
                                {highlightText(
                                  classItem.teacher || "Chưa có",
                                  searchValue
                                )}
                              </p>
                            </div>
                            <Tooltip title="Xem chi tiết lớp">
                              <Button
                                style={{
                                  color: "#fff",
                                  marginTop: 5,
                                }}
                                type="text"
                                icon={<EyeOutlined />}
                                onClick={() =>
                                  navigate(
                                    `/admin/class-manager/class-detail/${classItem._id}`
                                  )
                                }
                              />
                            </Tooltip>
                          </div>
                        }
                        bodyStyle={{ padding: "16px" }}
                      >
                        <p
                          style={{
                            fontWeight: 500,
                            color: "#53BC99",
                            position: "relative",
                            marginBottom: 0,
                            marginTop: -4,
                          }}
                        >
                          Số sinh viên hiện tại: {classItem.studentCount}/
                          {classItem.limit}
                        </p>
                        {!searchValue ? (
                          classItem.suggestedStudents.length > 0 ? (
                            <p style={{ fontSize: "13px", marginBottom: 5 }}>
                              Số sinh viên gợi ý:{" "}
                              {classItem.suggestedStudents.length}
                            </p>
                          ) : classItem.studentCount >= classItem.limit ? (
                            <div
                              style={{
                                display: "grid",
                                justifyContent: "center",
                                alignItems: "center",
                                marginTop: 46,
                              }}
                            >
                              <Image
                                width={110}
                                src="https://cdn-icons-png.flaticon.com/512/190/190411.png" // URL của hình ảnh thông báo lớp đầy
                                alt="Class Full"
                                preview={false}
                                style={{ opacity: 0.7 }}
                              />
                              <p
                                style={{
                                  marginTop: 19,
                                  fontWeight: 500,
                                  color: "#53BC99",
                                  position: "relative",
                                  left: -4,
                                }}
                              >
                                Lớp đã đủ sinh viên!
                              </p>
                            </div>
                          ) : (
                            <div
                              style={{
                                display: "grid",
                                justifyContent: "center",
                                alignItems: "center",
                                marginTop: 46,
                              }}
                            >
                              <Image
                                width={110}
                                src="https://png.pngtree.com/png-clipart/20230418/original/pngtree-suggestions-line-icon-png-image_9065435.png" // URL của hình ảnh thông báo lớp đầy
                                alt="Class Full"
                                preview={false}
                                style={{ opacity: 0.7 }}
                              />
                              <p
                                style={{
                                  marginTop: 19,
                                  fontWeight: 500,
                                  color: "#53BC99",
                                  position: "relative",
                                  left: 16,
                                }}
                              >
                                Có thể gợi ý!
                              </p>
                            </div>
                          )
                        ) : null}
                        {/* Hiển thị danh sách sinh viên trong lớp chỉ khi có tìm kiếm */}
                        {searchValue && (
                          <div className="student-suggest-list">
                            {classItem.students.length > 0 ? (
                              classItem.students.some(
                                (student) =>
                                  (student.username &&
                                    student.username
                                      .toLowerCase()
                                      .includes(searchValue)) ||
                                  (student.rollNumber &&
                                    student.rollNumber
                                      .toLowerCase()
                                      .includes(searchValue))
                              ) ? (
                                <List
                                  dataSource={classItem.students.filter(
                                    (student) =>
                                      (student.username &&
                                        student.username
                                          .toLowerCase()
                                          .includes(searchValue)) ||
                                      (student.rollNumber &&
                                        student.rollNumber
                                          .toLowerCase()
                                          .includes(searchValue))
                                  )}
                                  renderItem={(student) => (
                                    <List.Item
                                      key={student._id}
                                      style={{
                                        backgroundColor:
                                          matchedStudents.includes(student._id)
                                            ? "#f6ffed" // Màu nền sáng cho sinh viên trùng khớp tìm kiếm
                                            : "transparent",
                                        padding: 0,
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          width: "100%",
                                        }}
                                      >
                                        <span
                                          style={{ flex: 1, fontSize: "12px" }}
                                        >
                                          {highlightText(
                                            student.rollNumber || "N/A",
                                            searchValue
                                          )}{" "}
                                          -{" "}
                                          {highlightText(
                                            student.username,
                                            searchValue
                                          )}
                                        </span>
                                        {semester.status !== "Finished" && (
                                          <Tooltip title="Thao tác">
                                            <Dropdown
                                              overlay={
                                                <Menu>
                                                  <Menu.Item
                                                    key="transfer"
                                                    onClick={() =>
                                                      handleStudentAction(
                                                        "transfer",
                                                        student
                                                      )
                                                    }
                                                  >
                                                    Chuyển lớp
                                                  </Menu.Item>
                                                  <Menu.Item
                                                    key="swap"
                                                    onClick={() =>
                                                      handleStudentAction(
                                                        "swap",
                                                        student
                                                      )
                                                    }
                                                  >
                                                    Hoán đổi lớp
                                                  </Menu.Item>
                                                </Menu>
                                              }
                                              trigger={["click"]}
                                            >
                                              <Button
                                                type="text"
                                                icon={<PlusOutlined />}
                                              />
                                            </Dropdown>
                                          </Tooltip>
                                        )}
                                      </div>
                                    </List.Item>
                                  )}
                                />
                              ) : (
                                <Empty
                                  style={{ marginTop: 30 }}
                                  description="Không có sinh viên nào khớp với tìm kiếm trong lớp!"
                                />
                              )
                            ) : (
                              <Empty
                                style={{ marginTop: 30 }}
                                description="Chưa có sinh viên nào trong lớp!"
                              />
                            )}
                          </div>
                        )}

                        {/* Hiển thị danh sách sinh viên gợi ý khi không có tìm kiếm */}
                        {!searchValue &&
                          classItem.suggestedStudents.length > 0 && (
                            <div className="student-suggest-list">
                              <List
                                dataSource={classItem.suggestedStudents}
                                renderItem={(student) => (
                                  <List.Item
                                    key={student._id}
                                    style={{
                                      backgroundColor: swappedStudents.includes(
                                        student._id
                                      )
                                        ? "#ffe58f" // Màu nền sáng cho sinh viên đã hoán đổi
                                        : "transparent",
                                      padding: 0,
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        width: "100%",
                                      }}
                                    >
                                      <span
                                        style={{ flex: 1, fontSize: "12px" }}
                                      >
                                        {highlightText(
                                          student.rollNumber || "N/A",
                                          searchValue
                                        )}{" "}
                                        -{" "}
                                        {highlightText(
                                          student.username,
                                          searchValue
                                        )}
                                      </span>
                                      {semester.status !== "Finished" && (
                                        <Tooltip title="Chuyển sinh viên sang lớp khác">
                                          <Button
                                            type="text"
                                            icon={
                                              <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 24 24"
                                                width="17"
                                                height="17"
                                                color="#000000"
                                                fill="none"
                                              >
                                                <path
                                                  d="M3.78879 9.03708C3.0814 9.42 1.22668 10.2019 2.35633 11.1803C2.90815 11.6582 3.52275 12 4.29543 12H8.70457C9.47725 12 10.0918 11.6582 10.6437 11.1803C11.7733 10.2019 9.9186 9.42 9.21121 9.03708C7.55241 8.13915 5.44759 8.13915 3.78879 9.03708Z"
                                                  stroke="currentColor"
                                                  strokeWidth="1.5"
                                                />
                                                <path
                                                  d="M8.75 4.27273C8.75 5.52792 7.74264 6.54545 6.5 6.54545C5.25736 6.54545 4.25 5.52792 4.25 4.27273C4.25 3.01753 5.25736 2 6.5 2C7.74264 2 8.75 3.01753 8.75 4.27273Z"
                                                  stroke="currentColor"
                                                  strokeWidth="1.5"
                                                />
                                                <path
                                                  d="M4 15C4 18.3171 6.68286 21 10 21L9.14286 19.2857"
                                                  stroke="currentColor"
                                                  strokeWidth="1.5"
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                />
                                                <path
                                                  d="M20 9C20 5.68286 17.3171 3 14 3L14.8571 4.71429"
                                                  stroke="currentColor"
                                                  strokeWidth="1.5"
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                />
                                                <path
                                                  d="M14.7888 19.0371C14.0814 19.42 12.2267 20.2019 13.3563 21.1803C13.9082 21.6582 14.5227 22 15.2954 22H19.7046C20.4773 22 21.0918 21.6582 21.6437 21.1803C22.7733 20.2019 20.9186 19.42 20.2112 19.0371C18.5524 18.1392 16.4476 18.1392 14.7888 19.0371Z"
                                                  stroke="currentColor"
                                                  strokeWidth="1.5"
                                                />
                                                <path
                                                  d="M19.75 14.2727C19.75 15.5279 18.7426 16.5455 17.5 16.5455C16.2574 16.5455 15.25 15.5279 15.25 14.2727C15.25 13.0175 16.2574 12 17.5 12C18.7426 12 19.75 13.0175 19.75 14.2727Z"
                                                  stroke="currentColor"
                                                  strokeWidth="1.5"
                                                />
                                              </svg>
                                            }
                                            onClick={() =>
                                              setSelectedDropdown(
                                                selectedDropdown === student._id
                                                  ? null
                                                  : student._id
                                              )
                                            }
                                          />
                                        </Tooltip>
                                      )}
                                      {selectedDropdown === student._id && (
                                        <Select
                                          showSearch
                                          style={{ width: 150 }}
                                          placeholder="Chọn lớp"
                                          onChange={(targetClassId) =>
                                            handleSwitchClass(
                                              classItem._id, // currentClassId
                                              student,
                                              targetClassId
                                            )
                                          }
                                          onBlur={() =>
                                            setSelectedDropdown(null)
                                          }
                                        >
                                          {getAvailableClassesForSwap(
                                            classItem._id
                                          ).length > 0 ? (
                                            getAvailableClassesForSwap(
                                              classItem._id
                                            ).map((otherClass) => (
                                              <Option
                                                key={otherClass._id}
                                                value={otherClass._id}
                                              >
                                                {otherClass.username}
                                              </Option>
                                            ))
                                          ) : (
                                            <Option disabled>
                                              Không có lớp nào còn chỗ
                                            </Option>
                                          )}
                                        </Select>
                                      )}
                                    </div>
                                  </List.Item>
                                )}
                              />
                            </div>
                          )}

                        {/* Hiển thị nút lưu gợi ý khi không có tìm kiếm */}

                        {!searchValue &&
                          classItem.suggestedStudents.length !== 0 &&
                          semester.status !== "Finished" && (
                            <ConfirmButton
                              onClick={() => handleSaveClass(classItem._id)}
                              style={{
                                marginTop: "8px",
                              }}
                              disabled={
                                classItem.suggestedStudents.length === 0
                              }
                              content={" Lưu gợi ý"}
                            ></ConfirmButton>
                          )}
                      </Card>
                    </Col>
                  ))}
                </Row>
                {/* Phân trang cho danh sách lớp */}
                {classes
                  .filter((classItem) => {
                    if (!searchValue) return true;

                    // Tìm kiếm theo tên lớp, giáo viên hoặc sinh viên trong lớp
                    const isMatchedClass =
                      classItem.username.toLowerCase().includes(searchValue) ||
                      classItem.teacher.toLowerCase().includes(searchValue) ||
                      classItem.students.some(
                        (student) =>
                          (student.username &&
                            student.username
                              .toLowerCase()
                              .includes(searchValue)) ||
                          (student.rollNumber &&
                            student.rollNumber
                              .toLowerCase()
                              .includes(searchValue))
                      );

                    return isMatchedClass;
                  })
                  .filter((classItem) => {
                    if (filter === "all") return true;
                    if (filter === "full")
                      return classItem.studentCount >= classItem.limit;
                    if (filter === "noTeacher")
                      return (
                        !classItem.teacher || classItem.teacher === "Chưa có"
                      );
                    if (filter === "notFull")
                      return classItem.studentCount < classItem.limit;
                    return true;
                  }).length > classesPerPage && (
                  <Row justify="center" style={{ marginTop: "16px" }}>
                    <Pagination
                      current={currentClassPage}
                      pageSize={classesPerPage}
                      total={
                        classes
                          .filter((classItem) => {
                            if (!searchValue) return true;

                            // Tìm kiếm theo tên lớp, giáo viên hoặc sinh viên trong lớp
                            const isMatchedClass =
                              classItem.username
                                .toLowerCase()
                                .includes(searchValue) ||
                              classItem.teacher
                                .toLowerCase()
                                .includes(searchValue) ||
                              classItem.students.some(
                                (student) =>
                                  (student.username &&
                                    student.username
                                      .toLowerCase()
                                      .includes(searchValue)) ||
                                  (student.rollNumber &&
                                    student.rollNumber
                                      .toLowerCase()
                                      .includes(searchValue))
                              );

                            return isMatchedClass;
                          })
                          .filter((classItem) => {
                            if (filter === "all") return true;
                            if (filter === "full")
                              return classItem.studentCount >= classItem.limit;
                            if (filter === "noTeacher")
                              return (
                                !classItem.teacher ||
                                classItem.teacher === "Chưa có"
                              );
                            if (filter === "notFull")
                              return classItem.studentCount < classItem.limit;
                            return true;
                          }).length
                      }
                      onChange={handleClassPageChange}
                      showSizeChanger={false}
                    />
                  </Row>
                )}
              </>
            ) : (
              <Empty description="Không có lớp nào" />
            )}
          </Col>

          {/* Danh sách sinh viên chưa có lớp */}
          <Col span={6}>
            <Badge
              count={unassignedStudents.length}
              style={{
                backgroundColor: "#faad14",
                top: 52,
                right: 69,
                width: 20,
                boxShadow: "none",
              }}
            >
              <Card
                style={{ minWidth: 291 }}
                className="student-without-class-card"
                title={<>Sinh viên chưa có lớp </>}
              >
                {loading ? (
                  <Spin tip="Đang tải..." />
                ) : error ? (
                  <Alert
                    message="Lỗi"
                    description={error}
                    type="error"
                    showIcon
                  />
                ) : currentUnassignedStudents.length > 0 ? (
                  <>
                    <List
                      dataSource={currentUnassignedStudents}
                      renderItem={(student) => (
                        <List.Item
                          key={student._id}
                          style={{
                            backgroundColor: swappedStudents.includes(
                              student._id
                            )
                              ? "#ffe58f" // Màu nền sáng cho sinh viên đã hoán đổi
                              : matchedUnassignedStudents.includes(student._id)
                              ? "#f6ffed" // Màu nền sáng cho sinh viên trùng khớp tìm kiếm
                              : "transparent",
                            padding: 0,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              width: "100%",
                            }}
                          >
                            <span
                              style={{ flex: 1, fontSize: 13, marginRight: 10 }}
                            >
                              {highlightText(
                                student.rollNumber || "N/A",
                                searchValue
                              )}{" "}
                              - {highlightText(student.username, searchValue)}
                            </span>
                            {semester.status !== "Finished" && (
                              <Tooltip title="Thêm vào lớp">
                                <Button
                                  style={{
                                    width: 25,
                                    height: 25,
                                    margin: " 5px 0",
                                  }}
                                  icon={
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      width="15"
                                      height="15"
                                      color="#000000"
                                      fill="none"
                                    >
                                      <path
                                        d="M12.5 22H6.59087C5.04549 22 3.81631 21.248 2.71266 20.1966C0.453365 18.0441 4.1628 16.324 5.57757 15.4816C7.67837 14.2307 10.1368 13.7719 12.5 14.1052C13.3575 14.2261 14.1926 14.4514 15 14.7809"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                      <path
                                        d="M16.5 6.5C16.5 8.98528 14.4853 11 12 11C9.51472 11 7.5 8.98528 7.5 6.5C7.5 4.01472 9.51472 2 12 2C14.4853 2 16.5 4.01472 16.5 6.5Z"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                      />
                                      <path
                                        d="M18.5 22L18.5 15M15 18.5H22"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                      />
                                    </svg>
                                  }
                                  onClick={() =>
                                    setSelectedDropdown(
                                      selectedDropdown === student._id
                                        ? null
                                        : student._id
                                    )
                                  }
                                />
                              </Tooltip>
                            )}
                            {selectedDropdown === student._id && (
                              <Select
                                showSearch
                                style={{ width: 150, marginLeft: "8px" }}
                                placeholder="Chọn lớp"
                                onChange={(classId) => {
                                  addStudentToClass(classId, student); // Gọi hàm thêm sinh viên vào lớp
                                  setSelectedDropdown(null); // Đóng dropdown sau khi chọn lớp
                                }}
                                onBlur={() => setSelectedDropdown(null)} // Đóng dropdown khi mất focus
                              >
                                {classes.map((classItem) => (
                                  <Option
                                    key={classItem._id}
                                    value={classItem._id}
                                  >
                                    {`${classItem.username} (${classItem.studentCount}/${classItem.limit})`}
                                  </Option>
                                ))}
                              </Select>
                            )}
                          </div>
                        </List.Item>
                      )}
                    />
                    {/* Phân trang cho danh sách sinh viên chưa có lớp */}
                    {filteredUnassignedStudents.length > studentsPerPage && (
                      <Row justify="center" style={{ marginTop: "16px" }}>
                        <Pagination
                          current={currentStudentPage}
                          pageSize={studentsPerPage}
                          total={filteredUnassignedStudents.length}
                          onChange={handleStudentPageChange}
                          showSizeChanger={false}
                        />
                      </Row>
                    )}
                  </>
                ) : (
                  <Empty description="Chưa có sinh viên nào" />
                )}
              </Card>
            </Badge>
          </Col>
        </Row>

        {/* Modal tạo lớp mới */}
        <Modal
          title="Tạo Lớp Mới"
          visible={isModalVisible}
          onCancel={handleCancelCreateClass}
          onOk={handleCreateClass}
          okText="Tạo"
          cancelText="Hủy"
          confirmLoading={loading}
        >
          <Form
            form={form}
            layout="vertical"
            name="create_class_form"
            initialValues={{
              limitStudent: 30,
            }}
          >
            <Form.List name="newClasses">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }, index) => (
                    <div
                      key={key}
                      style={{
                        border: "1px solid #d9d9d9",
                        padding: "16px",
                        marginBottom: "16px",
                        borderRadius: "4px",
                        position: "relative",
                      }}
                    >
                      {fields.length > 1 && (
                        <CancelButton
                          content=" Xóa"
                          onClick={() => {
                            remove(name); // Sử dụng đúng hàm remove
                          }}
                          style={{
                            position: "relative",
                            top: "-8px",
                            right: "-389px",
                          }}
                        />
                      )}
                      <Form.Item
                        {...restField}
                        label="Tên Lớp"
                        name={[name, "className"]}
                        rules={[
                          {
                            required: true,
                            message: "Vui lòng nhập tên lớp",
                          },
                        ]}
                      >
                        <Input placeholder="Nhập tên lớp" />
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        label="Giáo Viên"
                        name={[name, "teacherId"]}
                        rules={[
                          {
                            required: true,
                            message: "Vui lòng chọn giáo viên",
                          },
                        ]}
                      >
                        <Select
                          showSearch
                          placeholder="Chọn giáo viên"
                          optionFilterProp="children"
                          filterOption={(input, option) =>
                            option.children
                              .toLowerCase()
                              .includes(input.toLowerCase())
                          }
                        >
                          {teachersList.map((teacher) => (
                            <Option key={teacher._id} value={teacher._id}>
                              {`${teacher.username} - ${teacher.email} - ${teacher.classCount} lớp`}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </div>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                    >
                      Thêm Lớp
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form>
        </Modal>
        {selectedStudent && transferModalVisible && (
          <TransferClassModal
            visible={transferModalVisible}
            onCancel={() => setTransferModalVisible(false)}
            student={selectedStudent}
            refreshData={() => {
              fetchClasses();
              fetchPendingUsers();
            }}
            currentSemester={currentSemester}
            isHander={true}
          />
        )}
        {selectedStudent && swapModalVisible && (
          <SwapClassModal
            visible={swapModalVisible}
            onCancel={() => setSwapModalVisible(false)}
            student={selectedStudent}
            refreshData={() => {
              fetchClasses();
              fetchPendingUsers();
            }}
          />
        )}
      </Content>
    </Layout>
  );
};

export default ClassManager;
