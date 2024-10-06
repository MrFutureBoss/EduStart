import axios from "axios";
import { BASE_URL } from "../utilities/initalValue.js";
import { useDispatch, useSelector } from "react-redux";
import { setProfessions } from "../redux/slice/ProfessionSlice.js";
import { useEffect } from "react";

const ProfessionManagement = () => {
  const dispatch = useDispatch();
  const professions = useSelector((state) => state.profession.professions.data); // Access the data array
  const total = useSelector((state) => state.profession.professions.total); // Access the total count

  // Call profession data
  useEffect(() => {
    axios
      .get(`${BASE_URL}/profession`)
      .then((res) => {
        dispatch(setProfessions(res.data)); // Pass the entire response to the reducer
      })
      .catch((err) => console.log("Error fetching professions", err));
  }, [dispatch]);
  console.log("Total: "+ total)

  return (
    <>
      <h1>Profession Management</h1>
      <p>Total Professions: {total}</p> {/* Display total count */}
      <div>
        {professions.map((pro) => (
          <div key={pro._id}>
            <p>ID: {pro._id}</p>
            <p>Name: {pro.name}</p>
          </div>
        ))}
      </div>
    </>
  );
};

export default ProfessionManagement;
