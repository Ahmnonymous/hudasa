import React from "react"
import { Link } from "react-router-dom"
import { Container, Row, Col } from "reactstrap"

//Import Images
import error from "../../assets/images/error-img.png"

const PagesUnauthorized = () => {
    //meta title
    document.title = "Unauthorized Access | Hudasa - Admin & Dashboard";

  return (
    <React.Fragment>
      <div className="account-pages my-5 pt-5">
        <Container>
          <Row>
            <Col lg="12">
              <div className="text-center mb-5">
                <h1 className="display-2 fw-medium">
                  4<i className="bx bx-shield-quarter bx-spin text-warning display-3" />
                  3
                </h1>
                <h4 className="text-uppercase">Access Denied</h4>
                <p className="text-muted mt-3">
                  You don't have permission to access this page. Please contact your administrator if you believe this is an error.
                </p>
                <div className="mt-5 text-center">
                  <Link
                    className="btn btn-primary "
                    to="/dashboard"
                  >
                    Back to Dashboard
                  </Link>
                </div>
              </div>
            </Col>
          </Row>
          <Row className="justify-content-center">
            <Col md="8" xl="6">
              <div>
                <img src={error} alt="" className="img-fluid" />
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  )
}

export default PagesUnauthorized

