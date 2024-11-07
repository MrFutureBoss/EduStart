import Notification from "../components/Notification/Notification";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../utilities/initalValue";
import { useDispatch, useSelector } from "react-redux";
import { setClassTaskData } from "../redux/slice/ClassManagementSlice";
import { Link } from "react-router-dom";
import { resetTeacherDashboardNotification } from "../redux/slice/NotificationSlice";

const TeacherDashBoardNotification = () => {
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const userId = localStorage.getItem("userId");

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
        const response = await axios.get(
          `${BASE_URL}/class/task/${userId}`,
          config
        );
        dispatch(setClassTaskData(response.data));
      } catch (error) {
        console.log(
          error.response ? error.response.data.message : error.message
        );
      }
    };

    fetchUserData();
  }, [userId, config, dispatch]);

  const classTask = useSelector((state) => state.classManagement.classtask) || {
    data: [],
  };

  const triggerTeacherDashboardNotification = useSelector(
    (state) => state.notification.teacherDashboardNotification
  );

  const classesWithEmptyGroup = Array.isArray(classTask.data)
    ? classTask.data.filter((item) => item.tempGroupId.length === 0)
    : [];

  const classesWithIncompleteGroups = Array.isArray(classTask.data)
    ? classTask.data.filter((item) =>
        item.tempGroupId.some((group) => group.status === false)
      )
    : [];

  // Số lượng lớp chưa được tạo nhóm
  const countClassesWithEmptyGroup = classesWithEmptyGroup.length;

  // Số lượng lớp chưa chốt nhóm xong
  const countClassesWithIncompleteGroups = classesWithIncompleteGroups.length;

  const countHighPriorityTask = countClassesWithEmptyGroup;
  const countWarmingPriorityTask = countClassesWithIncompleteGroups;

  return (
    <div>
      {/* Thông báo công việc cần ưu tiên xử lý */}
      {countHighPriorityTask > 0? (
        <Notification
          type="error"
          title={
            <h5>
              Bạn có {countClassesWithEmptyGroup} công việc cần giải quyết
            </h5>
          }
          description={<Link to="class">Bấm vào để xem chi tiết</Link>}
          triggerNotification={triggerTeacherDashboardNotification}
          showProgress={true}
          pauseOnHover={true}
          onClose={() => dispatch(resetTeacherDashboardNotification())}
        />
      ) : (
        <></>
      )}

      {/* Thông báo nhắc nhở*/}
      {countWarmingPriorityTask > 0 ? (
        <Notification
          type="warning"
          title={<h5>Có {countWarmingPriorityTask} việc bạn có thể để ý</h5>}
          description={<Link to="class">Bấm vào để xem chi tiết</Link>}
          triggerNotification={triggerTeacherDashboardNotification}
          showProgress={true}
          pauseOnHover={true}
          onClose={() => dispatch(resetTeacherDashboardNotification())}
        />
      ) : (
        <></>
      )}
    </div>
  );
};

export default TeacherDashBoardNotification;
