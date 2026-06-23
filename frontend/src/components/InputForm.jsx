import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

export default function InputForm() {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();

  const onSubmit = (data) => {
    console.log("Data ready for Backend API:", data);
    navigate('/results'); 
  };

  return (
    <div>
      <h2>Enter Parameters</h2>
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '300px' }}>
        <label>Temperature (°C):
          <input type="number" {...register("temperature")} style={{ width: '100%', padding: '8px' }} />
        </label>
        <label>pH Level:
          <input type="number" step="0.1" {...register("ph")} style={{ width: '100%', padding: '8px' }} />
        </label>
        <label>Feedstock Type:
          <select {...register("feedstock")} style={{ width: '100%', padding: '8px' }}>
            <option value="manure">Manure</option>
            <option value="food_waste">Food Waste</option>
          </select>
        </label>
        <button type="submit" style={{ padding: '10px', background: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Calculate Yield
        </button>
      </form>
    </div>
  );
}