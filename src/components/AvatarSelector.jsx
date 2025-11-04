import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Row,
  Col,
  Card,
  CardBody,
  Spinner,
  Nav,
  NavItem,
  NavLink,
} from "reactstrap";
import PropTypes from "prop-types";

const AvatarSelector = ({ isOpen, toggle, onSave, gender, currentAvatar }) => {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || "");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(gender === 1 ? "male" : "female");
  const [loading, setLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState(0);

  // Pre-configured Muslim-friendly avatars
  const maleAvatars = [
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShortFlat&facialHairType=BeardLight&facialHairColor=Black&clotheType=BlazerShirt&skinColor=Light",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShortCurly&facialHairType=Blank&clotheType=BlazerSweater&skinColor=Brown",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairDreads01&facialHairType=BeardMajestic&facialHairColor=Black&clotheType=BlazerShirt&skinColor=DarkBrown",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShortRound&facialHairType=BeardMedium&facialHairColor=Black&clotheType=BlazerSweater&skinColor=Tanned",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShortWaved&facialHairType=Blank&clotheType=BlazerShirt&skinColor=Pale",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairTheCaesar&facialHairType=BeardLight&facialHairColor=Black&clotheType=BlazerShirt&skinColor=Light",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShortFlat&facialHairType=MoustacheFancy&facialHairColor=Black&clotheType=BlazerSweater&skinColor=Brown",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShortCurly&facialHairType=Blank&clotheType=BlazerSweater&accessoriesType=Prescription02&skinColor=DarkBrown",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairDreads02&facialHairType=BeardMedium&facialHairColor=Black&clotheType=BlazerShirt&skinColor=Tanned",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairTheCaesarSidePart&facialHairType=BeardMajestic&facialHairColor=Black&clotheType=BlazerSweater&skinColor=Light",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShortWaved&facialHairType=Blank&clotheType=BlazerSweater&accessoriesType=Prescription01&skinColor=Brown",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShortCurly&facialHairType=BeardLight&facialHairColor=Black&clotheType=BlazerShirt&skinColor=DarkBrown",
  ];

  const femaleAvatars = [
    "https://avataaars.io/?avatarStyle=Transparent&topType=Hijab&clotheType=BlazerShirt&clotheColor=PastelBlue&skinColor=Light",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairStraight&clotheType=BlazerSweater&clotheColor=Heather&skinColor=Pale",
    "https://avataaars.io/?avatarStyle=Transparent&topType=Hijab&clotheType=BlazerShirt&clotheColor=Gray02&skinColor=Brown",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairStraight2&clotheType=BlazerShirt&clotheColor=PastelOrange&skinColor=Tanned",
    "https://avataaars.io/?avatarStyle=Transparent&topType=Hijab&clotheType=BlazerSweater&clotheColor=Blue03&skinColor=DarkBrown",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairCurly&clotheType=BlazerShirt&accessoriesType=Prescription01&skinColor=Light",
    "https://avataaars.io/?avatarStyle=Transparent&topType=Hijab&clotheType=BlazerSweater&clotheColor=PastelGreen&skinColor=Brown",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairStraightStrand&clotheType=BlazerShirt&clotheColor=PastelRed&skinColor=Pale",
    "https://avataaars.io/?avatarStyle=Transparent&topType=Hijab&clotheType=BlazerShirt&clotheColor=Blue01&skinColor=Light",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairStraight&clotheType=BlazerSweater&accessoriesType=Prescription02&skinColor=Tanned",
    "https://avataaars.io/?avatarStyle=Transparent&topType=Hijab&clotheType=BlazerSweater&clotheColor=Gray01&skinColor=Brown",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairStraight2&clotheType=BlazerShirt&clotheColor=PastelBlue&skinColor=DarkBrown",
  ];

  // Update active tab when gender prop changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(gender === 1 ? "male" : "female");
      setSelectedAvatar(currentAvatar || "");
      setLoading(true);
      setLoadedImages(0);
    }
  }, [isOpen, gender, currentAvatar]);

  // Select avatars based on active tab
  const avatars = activeTab === "male" ? maleAvatars : femaleAvatars;

  // Reset loading when tab changes
  useEffect(() => {
    setLoading(true);
    setLoadedImages(0);
  }, [activeTab]);

  const handleAvatarClick = (avatarUrl) => {
    setSelectedAvatar(avatarUrl);
  };

  const toggleTab = (tab) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
    }
  };

  const handleImageLoad = () => {
    setLoadedImages((prev) => {
      const newCount = prev + 1;
      if (newCount === avatars.length) {
        setLoading(false);
      }
      return newCount;
    });
  };

  const handleImageError = () => {
    setLoadedImages((prev) => {
      const newCount = prev + 1;
      if (newCount === avatars.length) {
        setLoading(false);
      }
      return newCount;
    });
  };

  const handleSave = async () => {
    if (!selectedAvatar) {
      alert("Please select an avatar first");
      return;
    }

    setSaving(true);
    try {
      await onSave(selectedAvatar);
      toggle();
    } catch (error) {
      console.error("Error saving avatar:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="xl">
      <ModalHeader toggle={toggle}>
        <i className="bx bx-user-circle me-2"></i>
        Select Avatar
      </ModalHeader>
      <ModalBody style={{ maxHeight: "70vh", overflowY: "auto" }}>
        <div className="mb-3">
          <p className="text-muted">
            <i className="bx bx-info-circle me-1"></i>
            Choose an avatar that represents you. Click on any avatar to select
            it.
          </p>
        </div>

        {/* Gender Tabs */}
        <Nav tabs className="nav-tabs-custom mb-4">
          <NavItem>
            <NavLink
              style={{ cursor: "pointer" }}
              className={activeTab === "male" ? "active" : ""}
              onClick={() => toggleTab("male")}
            >
              <i className="bx bx-male me-1"></i>
              Male
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              style={{ cursor: "pointer" }}
              className={activeTab === "female" ? "active" : ""}
              onClick={() => toggleTab("female")}
            >
              <i className="bx bx-female me-1"></i>
              Female
            </NavLink>
          </NavItem>
        </Nav>

        {loading ? (
          <div className="text-center py-5">
            <Spinner
              color="primary"
              style={{ width: "3rem", height: "3rem" }}
            />
            <p className="mt-3 text-muted">
              Loading avatars... ({loadedImages}/{avatars.length})
            </p>
          </div>
        ) : (
          <Row>
            {avatars.map((avatarUrl, index) => (
              <Col xs={6} sm={4} md={3} lg={2} key={index} className="mb-3">
                <Card
                  className={`avatar-card ${
                    selectedAvatar === avatarUrl ? "border-primary shadow" : ""
                  }`}
                  style={{
                    cursor: "pointer",
                    transition: "all 0.2s",
                    border:
                      selectedAvatar === avatarUrl
                        ? "3px solid #556ee6"
                        : "1px solid #dee2e6",
                  }}
                  onClick={() => handleAvatarClick(avatarUrl)}
                >
                  <CardBody className="p-2 text-center">
                    <img
                      src={avatarUrl}
                      alt={`Avatar ${index + 1}`}
                      className="img-fluid rounded-circle"
                      style={{
                        width: "100%",
                        height: "auto",
                        objectFit: "cover",
                      }}
                    />
                    {selectedAvatar === avatarUrl && (
                      <div className="mt-2">
                        <i
                          className="bx bx-check-circle text-primary"
                          style={{ fontSize: "1.5rem" }}
                        ></i>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* Hidden images for preloading */}
        <div style={{ display: "none" }}>
          {avatars.map((avatarUrl, index) => (
            <img
              key={`preload-${index}`}
              src={avatarUrl}
              alt=""
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          ))}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="light" onClick={toggle} disabled={saving}>
          Cancel
        </Button>
        <Button
          color="primary"
          onClick={handleSave}
          disabled={saving || !selectedAvatar}
        >
          {saving ? (
            <>
              <Spinner size="sm" className="me-2" />
              Saving...
            </>
          ) : (
            <>
              <i className="bx bx-save me-1"></i>
              Save Avatar
            </>
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

AvatarSelector.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggle: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  gender: PropTypes.number,
  currentAvatar: PropTypes.string,
};

AvatarSelector.defaultProps = {
  gender: 1,
  currentAvatar: "",
};

export default AvatarSelector;