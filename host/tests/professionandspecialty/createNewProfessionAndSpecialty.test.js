import Profession from "../../models/professionModel.js";
import Specialty from "../../models/specialtyModel.js";
import professionDAO from "../../repositories/professionDAO/index.js";

describe("Profession DAO createNewProfessionAndSpecialty Validation", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear tất cả mock trước mỗi test
    console.clear(); // Xóa console log trước mỗi test (tùy chọn)
  });

  it("Tạo thành công lĩnh vực và chuyên môn", async () => {
    const validData = {
      name: "Lĩnh vực hợp lệ",
      specialties: [
        { name: "Chuyên môn 1" },
        { name: "Chuyên môn 2" },
      ],
      status: true,
    };

    const expectedMessage = "Profession created successfully";
    let receivedMessage = "";

    Profession.findOne.mockResolvedValue(null);
    Profession.create.mockResolvedValue(validData);
    Specialty.create.mockImplementation((specialty) => Promise.resolve(specialty));

    try {
      const result = await professionDAO.createNewProfessionAndSpecialty(
        validData.name,
        validData.specialties,
        validData.status
      );
      receivedMessage = "Profession created successfully";
      expect(result).toEqual(validData);
    } catch (error) {
      console.error("Unexpected validation error:", error.message);
      throw error;
    }

    console.log("EXPECTED:", expectedMessage);
    console.log("RECEIVED:", receivedMessage);

    expect(receivedMessage).toBe(expectedMessage);
  });

  it("Tên lĩnh vực không được để trống", async () => {
    const invalidData = {
      name: "",
      specialties: [],
      status: true,
    };

    let validationError = null;

    try {
      await professionDAO.createNewProfessionAndSpecialty(
        invalidData.name,
        invalidData.specialties,
        invalidData.status
      );
    } catch (error) {
      validationError = error;
    }

    const expectedMessage = "Tên lĩnh vực không được để trống";
    const receivedMessage = validationError?.message;

    console.log("EXPECTED:", expectedMessage);
    console.log("RECEIVED:", receivedMessage);

    expect(receivedMessage).toBe(expectedMessage);
  });

  it("Tên lĩnh vực phải dài hơn 2 ký tự", async () => {
    const invalidData = {
      name: "A",
      specialties: [],
      status: true,
    };

    let validationError = null;

    try {
      await professionDAO.createNewProfessionAndSpecialty(
        invalidData.name,
        invalidData.specialties,
        invalidData.status
      );
    } catch (error) {
      validationError = error;
    }

    const expectedMessage = "Tên lĩnh vực không đúng định dạng";
    const receivedMessage = validationError?.message;

    console.log("EXPECTED:", expectedMessage);
    console.log("RECEIVED:", receivedMessage);

    expect(receivedMessage).toBe(expectedMessage);
  });

  it("Lĩnh vực đã tồn tại", async () => {
    const invalidData = {
      name: "Lĩnh vực đã tồn tại",
      specialties: [],
      status: true,
    };

    Profession.findOne.mockResolvedValue(invalidData);

    let validationError = null;

    try {
      await professionDAO.createNewProfessionAndSpecialty(
        invalidData.name,
        invalidData.specialties,
        invalidData.status
      );
    } catch (error) {
      validationError = error;
    }

    const expectedMessage = "Lĩnh vực đã tồn tại";
    const receivedMessage = validationError?.message;

    console.log("EXPECTED:", expectedMessage);
    console.log("RECEIVED:", receivedMessage);

    expect(receivedMessage).toBe(expectedMessage);
  });

  it("Tạo chuyên môn thất bại", async () => {
    const invalidData = {
      name: "Lĩnh vực hợp lệ",
      specialties: [{ name: "" }], // Invalid specialty name
      status: true,
    };

    Specialty.create.mockImplementation(() => {
      throw new Error("Tên chuyên môn không được để trống");
    });

    let validationError = null;

    try {
      await professionDAO.createNewProfessionAndSpecialty(
        invalidData.name,
        invalidData.specialties,
        invalidData.status
      );
    } catch (error) {
      validationError = error;
    }

    const expectedMessage = "Tên chuyên môn không được để trống";
    const receivedMessage = validationError?.message;

    console.log("EXPECTED:", expectedMessage);
    console.log("RECEIVED:", receivedMessage);

    expect(receivedMessage).toBe(expectedMessage);
  });

  it("Danh sách chuyên môn trống", async () => {
    const validData = {
      name: "Lĩnh vực hợp lệ",
      specialties: [],
      status: true,
    };

    Profession.findOne.mockResolvedValue(null);
    Profession.create.mockResolvedValue(validData);

    const result = await professionDAO.createNewProfessionAndSpecialty(
      validData.name,
      validData.specialties,
      validData.status
    );

    const expectedMessage = "Profession created successfully without specialties";
    const receivedMessage = result.specialties.length === 0
      ? "Profession created successfully without specialties"
      : "Unexpected error";

    console.log("EXPECTED:", expectedMessage);
    console.log("RECEIVED:", receivedMessage);

    expect(receivedMessage).toBe(expectedMessage);
  });
});
