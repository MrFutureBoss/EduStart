// import { useEffect, useMemo, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import axios from "axios";
// import { BASE_URL } from "../../utilities/initalValue";
// import { setSettingCreateGroupData } from "../../redux/slice/SettingCreateGroup";
// import { setTotalWaitUsers, setWaitUserList } from "../../redux/slice/TempGroupSlice";

// const AutoFinishJoinGroup = () => {
//   const dispatch = useDispatch();
//   const jwt = localStorage.getItem("jwt");

//   const config = useMemo(
//     () => ({
//       headers: {
//         "Content-Type": "application/json",
//         authorization: `Bearer ${jwt}`,
//       },
//     }),
//     [jwt]
//   );

//   //Setting của tạo nhóm
//   useEffect(() => {
//     const fetchUserData = async () => {
//       try {
//         const response = await axios.get(
//           `${BASE_URL}/creategroupsetting/class`,
//           config
//         );
//         dispatch(setSettingCreateGroupData(response.data));
//       } catch (error) {
//         console.log(
//           error.response ? error.response.data.message : error.message
//         );
//       }
//     };

//     fetchUserData();
//   }, [config, dispatch]);

//     //Danh sách những sinh viên chưa join vào nhóm
//     useEffect(() => {
//         if (!classId) return;
//         const fetchUserData = async () => {
//           try {
//             const response = await axios.get(
//               `${BASE_URL}/class/ungroup/${classId}`,
//               {
//                 ...config,
//               }
//             );
//             dispatch(setWaitUserList(response.data?.data));
//             dispatch(setTotalWaitUsers(response.data?.total));
//           } catch (error) {
//             console.log(
//               error.response ? error.response.data.message : error.message
//             );
//           }
//         };
    
//         fetchUserData();
//       }, [classId, config, dispatch]);

//   const settingCreateGroup = useSelector(
//     (state) => state.settingCreateGroup.settingcreategroups || []
//   );

//   const waitUserList = useSelector(
//     (state) => state.tempGroup.waituserlist || []
//   );

//   return <></>;
// };

// export default AutoFinishJoinGroup;
