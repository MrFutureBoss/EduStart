import axios from "axios";
import { BASE_URL } from "../utilities/initalValue.js";
import { useDispatch, useSelector } from "react-redux";
import { setProfessions } from "../redux/slice/ProfessionSlice.js";
import { useEffect} from "react";

const ProfessionManagement = () => {
  const dispatch = useDispatch();
  const professions = useSelector((state) => state.Profession.professions);

  //Call profession data
  useEffect(() => {
    axios
      .get(`${BASE_URL}/profession`)
      .then((res) => {
        dispatch(setProfessions(res.data));
      })
      .catch((err) => console.log("Error fetching mentor groups", err));
  }, [dispatch]);

  return (
    <>
      <h1>ProfessionManagement</h1>
      <div>
      {professions.map((pro) => (
        <div key={pro._id}>
          <p> ID: {pro._id}</p>
          <p> Name: {pro.name}</p>
        </div>
      ))}
      </div>
    </>
  );
};

export default ProfessionManagement;
