import React, { useEffect, useState, forwardRef } from "react";
import {
  Row,
  Col,
  Spin,
  Typography,
  Input,
  Button,
  Modal,
  Select,
  message,
} from "antd";
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  closestCorners,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDispatch, useSelector } from "react-redux";
import {
  setSelectedMentors,
  setAvailableMentors,
  setProfessions,
  setSpecialty,
  setMentorsBySpecialty,
  setCountsUpdate,
} from "../../../redux/slice/SelectMentorSlice";
import {
  fetchMentors,
  saveMentorSelection,
  fetchTeacherSelection,
  fetchTreeData,
} from "../../../api";
import PropTypes from "prop-types";
import MentorCard from "./MentorCard";
import "../teacherCSS/MentorSelection.css";
import {
  selectSelectedMentorsBySpecialty,
  selectAvailableMentorsBySpecialty,
  selectProfessionName,
  selectSpecialtyName,
} from "../../../redux/slice/Selectors";
import { showAlert } from "../../../components/SweetAlert";
const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

// Component SortableItem để sử dụng với @dnd-kit
const SortableItem = ({
  id,
  mentor,
  index,
  onMoveToSelected,
  onChangePosition,
  setHasChanges,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div className="mentor-item">
        {index !== undefined && (
          <div className="mentor-index-tag">{index + 1}</div>
        )}
        <MentorCard
          mentor={mentor}
          onMoveToSelected={onMoveToSelected}
          onChangePosition={onChangePosition}
          isSelected={index !== undefined} // Chỉ khi mentor đã chọn thì hiển thị index
          index={index}
          setHasChanges={setHasChanges}
        />
      </div>
    </div>
  );
};

SortableItem.propTypes = {
  id: PropTypes.string.isRequired,
  mentor: PropTypes.object.isRequired,
  index: PropTypes.number, // Truyền thêm index để hiển thị thứ tự
  onMoveToSelected: PropTypes.func.isRequired,
  onChangePosition: PropTypes.func.isRequired,
};

// Component DroppableContainer để sử dụng với danh sách có thể nhận mentor
const DroppableContainer = ({ id, children, className }) => {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={className}>
      {children}
    </div>
  );
};

DroppableContainer.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

const MentorSelection = forwardRef(
  ({ professionId, specialtyId, saveButtonRef }, ref) => {
    const dispatch = useDispatch();
    const selectedMentors = useSelector(
      selectSelectedMentorsBySpecialty(specialtyId)
    );
    const availableMentors = useSelector(
      selectAvailableMentorsBySpecialty(specialtyId)
    );
    const professionName = useSelector(selectProfessionName);
    const specialtyName = useSelector(selectSpecialtyName);
    const [activeId, setActiveId] = useState(null);
    const [searchAvailable, setSearchAvailable] = useState("");
    const [searchSelected, setSearchSelected] = useState("");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedMentor, setSelectedMentor] = useState(null);
    const [newPosition, setNewPosition] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const teacherId = localStorage.getItem("userId");

    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 5,
        },
      })
    );
    console.log(hasChanges);

    useEffect(() => {
      const getMentorsData = async () => {
        try {
          const selectedMentorsResponse = await fetchTeacherSelection(
            teacherId,
            professionId,
            specialtyId
          );

          let selectedMentorsData = [];
          if (
            selectedMentorsResponse.data &&
            selectedMentorsResponse.data.length > 0
          ) {
            selectedMentorsData = selectedMentorsResponse.data
              .sort((a, b) => a.priority - b.priority)
              .map((mentor) => ({
                ...mentor,
              }));
          }

          dispatch(
            setSelectedMentors({
              specialtyId,
              mentors: selectedMentorsData,
            })
          );

          const availableMentorsResponse = await fetchMentors(
            professionId,
            specialtyId
          );

          const availableMentorsData = availableMentorsResponse.data.filter(
            (mentor) =>
              !selectedMentorsData.some(
                (selected) => selected.mentorId._id === mentor.mentorId._id
              )
          );

          dispatch(
            setAvailableMentors({
              specialtyId,
              mentors: availableMentorsData,
            })
          );
        } catch (err) {
          console.error("Error fetching mentors:", err);
        }
      };

      if (professionId && specialtyId) {
        getMentorsData();
      }
    }, [professionId, specialtyId, dispatch]);

    const findContainer = (id) => {
      if (selectedMentors.some((mentor) => mentor._id === id)) {
        return "selectedMentors";
      }
      if (availableMentors.some((mentor) => mentor._id === id)) {
        return "availableMentors";
      }
      return null;
    };

    const handleDragStart = (event) => {
      const { active } = event;
      setActiveId(active.id);
    };

    const handleDragOver = (event) => {
      const { active, over } = event;

      const overId = over?.id;
      if (!overId) return;

      const activeContainer = findContainer(active.id);
      const overContainer = findContainer(overId) || overId;

      if (!activeContainer || !overContainer) return;

      if (activeContainer !== overContainer) {
        // Di chuyển giữa các container
        if (activeContainer === "selectedMentors") {
          const mentor = selectedMentors.find((m) => m._id === active.id);
          if (mentor) {
            dispatch(
              setSelectedMentors({
                specialtyId,
                mentors: selectedMentors.filter((m) => m._id !== active.id),
              })
            );
            dispatch(
              setAvailableMentors({
                specialtyId,
                mentors: [...availableMentors, { ...mentor, priority: null }],
              })
            );
          }
        } else if (overContainer === "selectedMentors") {
          const mentor = availableMentors.find((m) => m._id === active.id);
          if (mentor) {
            dispatch(
              setAvailableMentors({
                specialtyId,
                mentors: availableMentors.filter((m) => m._id !== active.id),
              })
            );
            dispatch(
              setSelectedMentors({
                specialtyId,
                mentors: [
                  ...selectedMentors,
                  { ...mentor, priority: selectedMentors.length + 1 },
                ],
              })
            );
          }
        }
        setHasChanges(true);
      }
    };

    const handleDragEnd = (event) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      const activeContainer = findContainer(active.id);
      const overContainer = findContainer(over.id) || over.id;

      if (!activeContainer || !overContainer) return;

      if (activeContainer === overContainer) {
        const items =
          activeContainer === "selectedMentors"
            ? selectedMentors
            : availableMentors;
        const activeIndex = items.findIndex((item) => item._id === active.id);
        const overIndex = items.findIndex((item) => item._id === over.id);

        if (activeIndex !== overIndex) {
          let newItems;
          if (activeContainer === "selectedMentors") {
            newItems = arrayMove(items, activeIndex, overIndex).map(
              (mentor, index) => ({
                ...mentor,
                priority: index + 1,
              })
            );
            dispatch(
              setSelectedMentors({
                specialtyId,
                mentors: newItems,
              })
            );
          } else {
            newItems = arrayMove(items, activeIndex, overIndex);
            dispatch(
              setAvailableMentors({
                specialtyId,
                mentors: newItems,
              })
            );
          }
          setHasChanges(true); // Cập nhật `hasChanges` khi sắp xếp lại
        }
      }
    };

    const handleMoveToSelected = (mentor) => {
      setIsModalVisible(true);
      setSelectedMentor(mentor);
      setNewPosition(selectedMentors.length + 1); // Default to last position
    };

    const handleChangePosition = (mentor) => {
      setIsModalVisible(true);
      setSelectedMentor(mentor);
      setNewPosition(
        selectedMentors.findIndex((m) => m._id === mentor._id) + 1
      );
    };

    const handleModalOk = () => {
      if (selectedMentor && newPosition !== null) {
        const isChangingPosition = selectedMentors.some(
          (m) => m._id === selectedMentor._id
        );

        if (isChangingPosition) {
          // Thay đổi vị trí mentor trong danh sách đã chọn
          const currentIndex = selectedMentors.findIndex(
            (m) => m._id === selectedMentor._id
          );
          const targetIndex = newPosition - 1;

          if (currentIndex === targetIndex) {
            message.warning("Mentor đã ở vị trí này.");
            setIsModalVisible(false);
            setSelectedMentor(null);
            return;
          }

          // Remove mentor from current position
          let newSelectedMentors = [...selectedMentors];
          newSelectedMentors.splice(currentIndex, 1);
          // Insert mentor at new position
          newSelectedMentors.splice(targetIndex, 0, selectedMentor);

          // Update priorities based on new order
          newSelectedMentors = newSelectedMentors.map((mentor, index) => ({
            ...mentor,
            priority: index + 1,
          }));

          // Dispatch actions to update Redux state
          dispatch(
            setSelectedMentors({
              specialtyId,
              mentors: newSelectedMentors,
            })
          );

          // No need to update availableMentors since mentor is already selected
          setIsModalVisible(false);
          setSelectedMentor(null);
        } else {
          // Chọn mentor từ danh sách chưa chọn và thêm vào danh sách đã chọn tại vị trí mới
          const position = Math.max(
            0,
            Math.min(selectedMentors.length, newPosition - 1)
          );
          const newSelectedMentors = [
            ...selectedMentors.slice(0, position),
            { ...selectedMentor, priority: position + 1 }, // Đặt vị trí khi thêm vào danh sách đã chọn
            ...selectedMentors.slice(position),
          ];

          // Update priorities
          const updatedSelectedMentors = newSelectedMentors.map(
            (mentor, index) => ({
              ...mentor,
              priority: index + 1,
            })
          );

          // Dispatch actions to update Redux state
          dispatch(
            setSelectedMentors({
              specialtyId,
              mentors: updatedSelectedMentors,
            })
          );
          dispatch(
            setAvailableMentors({
              specialtyId,
              mentors: availableMentors.filter(
                (m) => m._id !== selectedMentor._id
              ),
            })
          );

          // Close modal and reset state
          setIsModalVisible(false);
          setSelectedMentor(null);
        }
      }
    };

    const handleModalCancel = () => {
      setIsModalVisible(false);
      setSelectedMentor(null);
    };

    const handleSaveSelection = async () => {
      // Hiển thị xác nhận trước khi lưu
      const result = await showAlert(
        "Xác nhận",
        "Bạn có chắc chắn muốn lưu các thay đổi?",
        "question"
      );

      if (result.isConfirmed) {
        const dataToSave = {
          teacherId: localStorage.getItem("userId"),
          professionId,
          specialtyId,
          selectedMentors: selectedMentors.map((mentor, index) => ({
            mentorId: mentor?.mentorId?._id,
            priority: index + 1,
          })),
        };

        try {
          // Lưu lựa chọn mentor
          await saveMentorSelection(dataToSave);
          message.success("Lưu lựa chọn thành công!");

          // Cập nhật dữ liệu và dispatch về Redux
          const response = await fetchTreeData(teacherId);
          const {
            professionCount,
            specialtyCount,
            updatedCount,
            notUpdatedCount,
          } = response.data;
          dispatch(
            setCountsUpdate({
              professionCount,
              specialtyCount,
              notUpdatedCount,
              updatedCount,
            })
          );
          dispatch(setProfessions(response.data.treeData));
          dispatch(setSpecialty([]));

          // Lấy lại mentor đã chọn và dispatch về Redux
          const Selectresponse = await fetchTeacherSelection(
            teacherId,
            professionId,
            specialtyId
          );
          dispatch(
            setMentorsBySpecialty({ specialtyId, mentors: Selectresponse.data })
          );

          // Sau khi lưu thành công, đặt `hasChanges` về `false`
          setHasChanges(false);
        } catch (error) {
          message.error("Lưu lựa chọn thất bại.");
          console.error("Lỗi khi lưu lựa chọn:", error);
        }
      }
    };

    const handleSearchAvailable = (value) => {
      setSearchAvailable(value.toLowerCase());
    };

    const handleSearchSelected = (value) => {
      setSearchSelected(value.toLowerCase());
    };
    console.log("availableMentors", availableMentors);

    const filteredAvailableMentors =
      availableMentors?.filter(
        (mentor) =>
          mentor.mentorId?.email?.toLowerCase().includes(searchAvailable) ||
          mentor.mentorId?.username?.toLowerCase().includes(searchAvailable)
      ) || [];

    const filteredSelectedMentors =
      selectedMentors?.filter(
        (mentor) =>
          mentor.mentorId?.email?.toLowerCase().includes(searchSelected) ||
          mentor.mentorId?.username?.toLowerCase().includes(searchSelected)
      ) || [];

    if (!selectedMentors || !availableMentors) return <Spin />;

    return (
      <div ref={ref}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Title level={4}>
              Chọn Mentor Cho Lĩnh Vực:
              <strong style={{ marginLeft: 5, color: "#4682B4" }}>
                {professionName}
              </strong>{" "}
              - Chuyên Môn:
              <strong style={{ marginLeft: 5, color: "#4682B4" }}>
                {specialtyName}
              </strong>
            </Title>
          </Col>
        </Row>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <Row gutter={[16, 16]}>
            {/* Mentor Đã Chọn */}
            <Col span={12}>
              <div className="mentor-container selected-mentor-list">
                <Title level={5}>Mentor Đã Chọn</Title>
                <Search
                  placeholder="Tìm kiếm mentor đã chọn"
                  onSearch={handleSearchSelected}
                  enterButton
                  style={{ marginBottom: 10 }}
                  allowClear
                />
                <DroppableContainer
                  id="selectedMentors"
                  className="mentor-list"
                >
                  <SortableContext
                    id="selectedMentors"
                    items={filteredSelectedMentors.map((mentor) => mentor._id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {filteredSelectedMentors.length === 0 ? (
                      <div className="mentor-placeholder">
                        Kéo mentor vào đây để chọn
                      </div>
                    ) : (
                      filteredSelectedMentors.map((mentor, index) => (
                        <SortableItem
                          key={mentor._id}
                          id={mentor._id}
                          mentor={mentor}
                          index={index}
                          onMoveToSelected={handleMoveToSelected}
                          onChangePosition={handleChangePosition}
                        />
                      ))
                    )}
                  </SortableContext>
                </DroppableContainer>
              </div>
            </Col>
            {/* Mentor Chưa Chọn */}
            <Col span={12}>
              <div className="mentor-container available-mentor-list">
                <Title level={5}>Mentor Chưa Chọn</Title>
                <Search
                  placeholder="Tìm kiếm mentor chưa chọn"
                  onSearch={handleSearchAvailable}
                  enterButton
                  style={{ marginBottom: 10 }}
                  allowClear
                />
                <DroppableContainer
                  id="availableMentors"
                  className="mentor-list"
                >
                  <SortableContext
                    id="availableMentors"
                    items={filteredAvailableMentors.map((mentor) => mentor._id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {filteredAvailableMentors.length === 0 ? (
                      <div className="mentor-placeholder">
                        Không có mentor nào
                      </div>
                    ) : (
                      filteredAvailableMentors.map((mentor) => (
                        <SortableItem
                          key={mentor._id}
                          id={mentor._id}
                          mentor={mentor}
                          onMoveToSelected={handleMoveToSelected}
                          onChangePosition={() => {}}
                          setHasChanges={setHasChanges}
                          showMenu={true}
                        />
                      ))
                    )}
                  </SortableContext>
                </DroppableContainer>
              </div>
            </Col>
          </Row>
          <DragOverlay>
            {activeId ? (
              <div className="mentor-item">
                <MentorCard
                  mentor={
                    availableMentors.find((m) => m._id === activeId) ||
                    selectedMentors.find((m) => m._id === activeId)
                  }
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
        <Button
          style={{
            marginTop: 20,
            float: "right",
            backgroundColor: "#62b6cb",
            color: "white",
            display: hasChanges ? "inline-block" : "none",
          }}
          onClick={handleSaveSelection}
          ref={saveButtonRef}
        >
          Lưu lựa chọn
        </Button>
        {/* Modal để thay đổi vị trí */}
        <Modal
          title="Chọn mức độ ưu tiên"
          visible={isModalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
        >
          <Select
            value={newPosition}
            onChange={setNewPosition}
            style={{ width: "100%" }}
          >
            {selectedMentors.map((_, index) => (
              <Option key={index + 1} value={index + 1}>
                Vị trí {index + 1}
              </Option>
            ))}
            {!selectedMentors.includes(selectedMentor) && (
              <Option value={selectedMentors.length + 1}>
                Vị trí {selectedMentors.length + 1}
              </Option>
            )}
          </Select>
        </Modal>
      </div>
    );
  }
);

MentorSelection.propTypes = {
  professionId: PropTypes.string.isRequired,
  specialtyId: PropTypes.string.isRequired,
  saveButtonRef: PropTypes.object,
};

export default MentorSelection;
