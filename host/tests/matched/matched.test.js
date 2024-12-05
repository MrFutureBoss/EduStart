import matchedDAO from "../../repositories/matchedDAO/matched.js";
import Matched from "../../models/matchedModel.js";

jest.mock("../../models/matchedModel.js");

describe("DAO: createNewTimeEvents", () => {
  it("nên thêm sự kiện mới vào bản ghi Matched", async () => {
    const id = "60b6a70f9347a011d0a26c12";
    const newTimeArray = [
      { title: "Sự kiện 1", allDay: false, start: "2024-01-01T10:00:00Z", end: "2024-01-01T12:00:00Z" },
      { title: "Sự kiện 2", allDay: true, start: "2024-01-02T00:00:00Z", end: "2024-01-02T23:59:59Z" },
    ];

    const mockUpdatedMatched = {
      _id: id,
      time: [...newTimeArray],
    };

    Matched.findByIdAndUpdate.mockResolvedValue(mockUpdatedMatched);

    const result = await matchedDAO.createNewTimeEvents(id, newTimeArray);

    expect(Matched.findByIdAndUpdate).toHaveBeenCalledWith(
      id,
      { $push: { time: { $each: newTimeArray } } },
      { new: true, runValidators: true }
    );
    expect(result).toEqual(mockUpdatedMatched);
  });

  it("nên trả lỗi nếu ID không hợp lệ", async () => {
    const invalidId = "123";
    const newTimeArray = [
      { title: "Sự kiện 1", allDay: false, start: "2024-01-01T10:00:00Z", end: "2024-01-01T12:00:00Z" },
    ];

    await expect(matchedDAO.createNewTimeEvents(invalidId, newTimeArray)).rejects.toThrow(
      "ID Matched không hợp lệ"
    );
    expect(Matched.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("nên trả lỗi nếu mảng sự kiện rỗng", async () => {
    const id = "60b6a70f9347a011d0a26c12";
    const emptyArray = [];

    await expect(matchedDAO.createNewTimeEvents(id, emptyArray)).rejects.toThrow(
      "Danh sách sự kiện không được để trống"
    );
    expect(Matched.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("nên trả lỗi nếu không tìm thấy bản ghi Matched", async () => {
    const id = "60b6a70f9347a011d0a26c12";
    const newTimeArray = [
      { title: "Sự kiện 1", allDay: false, start: "2024-01-01T10:00:00Z", end: "2024-01-01T12:00:00Z" },
    ];

    Matched.findByIdAndUpdate.mockResolvedValue(null);

    await expect(matchedDAO.createNewTimeEvents(id, newTimeArray)).rejects.toThrow(
      "Không tìm thấy bản ghi Matched"
    );
    expect(Matched.findByIdAndUpdate).toHaveBeenCalledWith(
      id,
      { $push: { time: { $each: newTimeArray } } },
      { new: true, runValidators: true }
    );
  });

  it("nên xử lý lỗi bất ngờ", async () => {
    const id = "60b6a70f9347a011d0a26c12";
    const newTimeArray = [
      { title: "Sự kiện 1", allDay: false, start: "2024-01-01T10:00:00Z", end: "2024-01-01T12:00:00Z" },
    ];

    const mockError = new Error("Lỗi cơ sở dữ liệu bất ngờ");
    Matched.findByIdAndUpdate.mockRejectedValue(mockError);

    await expect(matchedDAO.createNewTimeEvents(id, newTimeArray)).rejects.toThrow(
      "Lỗi cơ sở dữ liệu bất ngờ"
    );
    expect(Matched.findByIdAndUpdate).toHaveBeenCalledWith(
      id,
      { $push: { time: { $each: newTimeArray } } },
      { new: true, runValidators: true }
    );
  });
});
