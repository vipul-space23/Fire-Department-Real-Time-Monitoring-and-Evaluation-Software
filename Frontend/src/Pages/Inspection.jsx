import React, { useState, useEffect } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid"; // Import UUID library
import "./CSS/Inspection.css";
import Sidebar from "../Components/Sidebar";

// Predefined list of officers
const officers = [
  { id: "OFF-001", name: "John Doe" },
  { id: "OFF-002", name: "Jane Smith" },
  { id: "OFF-003", name: "Mike Johnson" },
  { id: "OFF-004", name: "Emily Davis" },
  { id: "OFF-005", name: "Sarah Wilson" }
];

const Inspection = () => {
  const [inspections, setInspections] = useState([]);
  const [newInspection, setNewInspection] = useState({
    location: "",
    dateTime: "",
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Fetch inspections from the API when the component mounts
    axios.get("http://localhost:5000/inspections")
      .then(response => {
        setInspections(response.data);
      })
      .catch(error => console.error("There was an error fetching the inspections!", error));
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleInputChange = (e) => {
    setNewInspection({
      ...newInspection,
      [e.target.name]: e.target.value,
    });
  };

  const handleNewInspectionSubmit = (e) => {
    e.preventDefault();

    // Randomly assign an officer from the list
    const assignedOfficer = officers[Math.floor(Math.random() * officers.length)];

    // Create a new inspection with autogenerated ID, assigned officer, and default status
    const inspectionToAdd = {
      id: uuidv4(), // Use uuid to generate unique inspection ID
      location: newInspection.location,
      dateTime: newInspection.dateTime,
      officer: assignedOfficer.name, // Assign the officer's name
      officerId: assignedOfficer.id,  // Store officer ID as well (optional)
      status: "Scheduled" // Default status
    };

    // Post the new inspection to the backend
    axios.post("http://localhost:5000/inspections", inspectionToAdd)
      .then(response => {
        setInspections([...inspections, response.data]); // Update the state with the new inspection
        setNewInspection({ location: "", dateTime: "" }); // Clear the form
      })
      .catch(error => console.error("There was an error adding the inspection!", error));
  };

  const handleDelete = (id) => {
    axios.delete(`http://localhost:5000/inspections/${id}`)
      .then(() => {
        setInspections(inspections.filter(inspection => inspection.id !== id));
      })
      .catch(error => console.error("There was an error deleting the inspection!", error));
  };

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="dashboard-main">
        <h1>Fire Department Inspections</h1>
        <h2>Scheduled Inspections</h2>
        <table className="inspections-table">
          <thead>
            <tr>
              <th>Inspection ID</th>
              <th>Location</th>
              <th>Date & Time</th>
              <th>Assigned Officer</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inspections.map((inspection) => (
              <tr key={inspection.id}>
                <td>{inspection.id}</td>
                <td>{inspection.location}</td>
                <td>{inspection.dateTime}</td>
                <td>{inspection.officer}</td>
                <td><span className={`status-${inspection.status.toLowerCase()}`}>{inspection.status}</span></td>
                <td>
                  <button className="action-btn" onClick={() => handleDelete(inspection.id)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>Schedule New Inspection</h2>
        <form className="new-inspection-form" onSubmit={handleNewInspectionSubmit}>
          <input
            type="text"
            name="location"
            value={newInspection.location}
            onChange={handleInputChange}
            placeholder="Enter inspection location"
            required
          />
          <input
            type="datetime-local"
            name="dateTime"
            value={newInspection.dateTime}
            onChange={handleInputChange}
            required
          />
          <button type="submit">Schedule Inspection</button>
        </form>
      </div>
    </div>
  );
};

export default Inspection;
