import React, { useState, useEffect } from "react";
import { Card, CardBody, Progress } from "reactstrap";

const Storage = ({ files }) => {
  const [storageInfo, setStorageInfo] = useState({
    used: 0,
    total: 5 * 1024 * 1024 * 1024, // 5GB default
    percentage: 0,
  });

  useEffect(() => {
    if (files && files.length > 0) {
      const totalUsed = files.reduce((sum, file) => sum + (file.file_size || 0), 0);
      const totalStorage = 5 * 1024 * 1024 * 1024; // 5GB
      const percentage = Math.round((totalUsed / totalStorage) * 100);
      
      setStorageInfo({
        used: totalUsed,
        total: totalStorage,
        percentage: Math.min(percentage, 100),
      });
    } else {
      setStorageInfo({
        used: 0,
        total: 5 * 1024 * 1024 * 1024,
        percentage: 0,
      });
    }
  }, [files]);

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getProgressColor = (percentage) => {
    if (percentage < 50) return "success";
    if (percentage < 80) return "warning";
    return "danger";
  };

  return (
    <Card>
      <CardBody className="p-2">
        <div className="text-center mb-2">
          <i className="bx bx-cloud text-primary font-size-24 mb-2"></i>
          <h6 className="mb-1" style={{ fontSize: "0.95rem" }}>Storage</h6>
          <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>
            <span className="fw-medium">{formatBytes(storageInfo.used)}</span> / {formatBytes(storageInfo.total)}
          </p>
        </div>

        <Progress
          value={storageInfo.percentage}
          color={getProgressColor(storageInfo.percentage)}
          className="mb-2"
          style={{ height: "6px" }}
        />

        <div className="text-center mb-2">
          <small className="text-muted">{storageInfo.percentage}% used</small>
        </div>

        <div className="border-top pt-2">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>
              <i className="bx bx-file me-1 text-primary"></i>
              Files
            </span>
            <span className="fw-medium" style={{ fontSize: '0.8rem' }}>{files.length}</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default Storage;
