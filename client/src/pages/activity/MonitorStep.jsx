import React, { useState, useEffect, useMemo } from "react";
import { Steps, Tooltip, Spin, message, Popover } from "antd";
import moment from "moment";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import { useDispatch, useSelector } from "react-redux";
import { setClassList } from "../../redux/slice/ClassSlice";
import { DownOutlined, UpOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Step } = Steps;

const MonitorStep = () => {
  const [loading, setLoading] = useState(true);
  const [outcomes, setOutcomes] = useState([]);
  const [groupsNotSubmitted, setGroupsNotSubmitted] = useState({});
  const [semester, setSemester] = useState(null);
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [popoverTarget, setPopoverTarget] = useState(null);
  const dispatch = useDispatch();
  const classList = useSelector((state) => state.class.classList);
  const navigate = useNavigate();

  const jwt = localStorage.getItem("jwt");
  const config = useMemo(
    () => ({
      headers: { Authorization: `Bearer ${jwt}` },
    }),
    [jwt]
  );

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/class/${localStorage.getItem("userId")}/user`,
          config
        );
        dispatch(setClassList(response.data));
      } catch (error) {
        console.error("Error fetching class list:", error);
        message.error("Không thể tải danh sách lớp học.");
      }
    };
    if (classList?.length === 0) {
      fetchClasses();
    }
  }, [classList?.length, dispatch, config]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const semesterResponse = await axios.get(
          `${BASE_URL}/semester/current`,
          config
        );
        const fetchedSemester = semesterResponse.data;
        setSemester(fetchedSemester);

        const outcomesResponse = await axios.get(
          `${BASE_URL}/activity/outcome-type/semester/${fetchedSemester._id}`,
          config
        );

        const sortedOutcomes = outcomesResponse.data.sort((a, b) => {
          const numberA = parseInt(a.name.replace(/[^0-9]/g, ""), 10);
          const numberB = parseInt(b.name.replace(/[^0-9]/g, ""), 10);
          return numberA - numberB;
        });

        const calculateStartdateAndEnddateOfOutcomes = (
          semesterStart,
          semesterEnd,
          count
        ) => {
          const start = moment(semesterStart);
          const end = moment(semesterEnd);
          const duration = end.diff(start, "days") / count;
          let outcomesCalculated = {};

          for (let i = 1; i <= count; i++) {
            const outcomeStart = start.clone().add((i - 1) * duration, "days");
            const outcomeEnd = start.clone().add(i * duration - 1, "days");
            outcomesCalculated[`outcome${i}`] = {
              startDate: outcomeStart.format("YYYY-MM-DD"),
              endDate: outcomeEnd.format("YYYY-MM-DD"),
            };
          }

          return outcomesCalculated;
        };

        const calculatedOutcomes = calculateStartdateAndEnddateOfOutcomes(
          fetchedSemester.startDate,
          fetchedSemester.endDate,
          sortedOutcomes.length
        );

        const updatedOutcomes = sortedOutcomes.map((outcome, index) => {
          const calculatedOutcome =
            calculatedOutcomes[`outcome${index + 1}`] || {};
          return {
            ...outcome,
            startDate: outcome.startDate
              ? moment(outcome.startDate)
              : moment(
                  calculatedOutcome.startDate || fetchedSemester.startDate
                ),
            endDate: outcome.endDate
              ? moment(outcome.endDate)
              : moment(calculatedOutcome.endDate || fetchedSemester.endDate),
          };
        });

        setOutcomes(updatedOutcomes);
      } catch (error) {
        console.error("Error fetching data:", error);
        message.error("Không thể tải dữ liệu outcomes.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [config]);

  const fetchGroupsNotSubmitted = async (outcomeId) => {
    try {
      const groupedResults = await Promise.all(
        classList.map(async (cls) => {
          const response = await axios.get(
            `${BASE_URL}/activity/unsubmitted-groups?outcomeId=${outcomeId}&classId=${cls._id}`,
            config
          );

          return {
            className: cls.className,
            groups: response.data[cls.className] || [],
          };
        })
      );

      const groupedByClass = groupedResults.reduce(
        (acc, { className, groups }) => {
          if (groups.length > 0) {
            acc[className] = groups;
          }
          return acc;
        },
        {}
      );

      setGroupsNotSubmitted(groupedByClass);
    } catch (error) {
      console.error("Error fetching groups not submitted:", error);
      message.error("Không thể tải danh sách nhóm chưa nộp.");
    }
  };

  const sortedOutcomes = useMemo(() => {
    const sorted = [...outcomes].sort((a, b) =>
      moment(a.startDate).diff(moment(b.startDate))
    );
    return sorted;
  }, [outcomes]);

  const currentStep = useMemo(() => {
    const today = moment();
    for (let i = 0; i < sortedOutcomes.length; i++) {
      const outcome = sortedOutcomes[i];
      const startDate = moment(outcome.startDate);
      const endDate = moment(outcome.endDate);

      if (today.isBetween(startDate, endDate, "day", "[]")) {
        return i;
      }
    }
    return sortedOutcomes.length - 1;
  }, [sortedOutcomes]);

  useEffect(() => {
    if (sortedOutcomes[currentStep] && classList.length > 0) {
      const outcomeId = sortedOutcomes[currentStep]._id;
      fetchGroupsNotSubmitted(outcomeId);
    }
  }, [currentStep, sortedOutcomes, classList]);

  if (loading) {
    return <Spin size="large" tip="Loading outcomes..." />;
  }

  const currentOutcome = sortedOutcomes[currentStep] || {};

  const popoverContent = (
    <div>
      <p>
        <strong>Loại: {currentOutcome.name}</strong>
      </p>
      <strong>Số nhóm chưa nộp:</strong>
      {Object.entries(groupsNotSubmitted).map(([className, groups], index) => (
        <div key={index} style={{ marginBottom: "8px" }}>
          <Tooltip title={groups.join(", ")}>
            <span
              style={{
                cursor: "pointer",
                textDecoration: "underline",
              }}
              onClick={() =>
                navigate(`/teacher/class/detail/${className}/outcomes`)
              }
            >
              {className} ({groups.length})
            </span>
          </Tooltip>
        </div>
      ))}
    </div>
  );

  const togglePopover = () => {
    if (popoverVisible && popoverTarget) {
      setPopoverVisible(false);
      setPopoverTarget(null);
    } else {
      const currentStepElement = document.querySelector(
        ".ant-steps-item-process, .ant-steps-item-active"
      );
      if (currentStepElement) {
        setPopoverTarget(currentStepElement);
        setPopoverVisible(true);
      }
    }
  };

  return (
    <div
      style={{
        display: "flex",
        margin: "auto",
        width: "80%",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{ marginRight: "10px" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#1890ff";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "";
        }}
      >
        <Popover
          content={popoverContent}
          trigger="click"
          visible={popoverVisible}
          onVisibleChange={(visible) => {
            setPopoverVisible(visible);
            if (!visible) setPopoverTarget(null);
          }}
          placement="rightTop"
          getPopupContainer={() => document.body}
        >
          {popoverVisible ? (
            <UpOutlined
              onClick={togglePopover}
              style={{ fontSize: "24px", cursor: "pointer" }}
            />
          ) : (
            <DownOutlined
              onClick={togglePopover}
              style={{ fontSize: "24px", cursor: "pointer" }}
            />
          )}
        </Popover>
      </div>
      <Steps current={currentStep} direction="horizontal">
        {sortedOutcomes.map((outcome, index) => (
          <Step
            key={outcome._id || index}
            title={outcome.name}
            description={
              <Tooltip
                title={`Kết thúc: ${moment(outcome.endDate).format(
                  "DD/MM/YYYY"
                )}`}
              >
                <span>{moment(outcome.endDate).format("DD/MM/YYYY")}</span>
              </Tooltip>
            }
          />
        ))}
      </Steps>
    </div>
  );
};

export default MonitorStep;
