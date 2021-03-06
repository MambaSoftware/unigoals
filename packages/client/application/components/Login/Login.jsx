import CircularProgress from '@material-ui/core/CircularProgress';
import CardContent from '@material-ui/core/CardContent';
import Card from '@material-ui/core/Card';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { Redirect } from 'react-router-dom';
import Button from '@material-ui/core/Button';
import PropTypes from 'prop-types';
import React from 'react';
import _ from 'lodash';

import { withSnackbar } from '../Utilities/SnackbarWrapper';
import firebase from '../../utils/FirebaseWrapper';
import { isMobileDevice } from '../../utils/utils';
import * as homePageData from './homePageData';

import UnitTable from '../Unit/index';
import Summary from '../Summary/Summary';

const styles = (theme) => ({
  root: {
    textAlign: 'center',
    paddingTop: theme.spacing.unit * 2,
  },
  title: {
    color: 'rgba(0, 0, 0, 0.54)',
  },
  card: {
    marginTop: theme.spacing.unit * 2,
    minWidth: 300,
    maxWidth: '60%',
    margin: '0 auto',
    [theme.breakpoints.down('md')]: {
      maxWidth: '90%',
    },
  },
  summary: {
    marginTop: '25px',
    marginBottom: '50px',
  },
  text: {
    textAlign: 'justify',
  },
  loading: {
    marginTop: '50vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

class Login extends React.Component {
  constructor(props) {
    super(props);

    this.authenticate = this.authenticate.bind(this);
    this.updateContentForUser = this.updateContentForUser.bind(this);
    this.handleAuthenticationError = this.handleAuthenticationError.bind(this);
    this.loginWithGoogle = this.loginWithGoogle.bind(this);

    this.state = {
      loading: true,
      isMobile: isMobileDevice(),
      isExample: true,
      redirectToReferrer: props.profile.auth,
    };
  }

  /**
   * Checking to see if its logging in with a redirection or able to automatically log the user
   * back in with a existing session that is persisted.
   */
  componentDidMount() {
    const { authentication } = firebase;

    authentication.getRedirectResult().then((login) => {
      if (!_.isNil(login.user)) {
        authentication
          .signInAndRetrieveDataWithCredential(login.credential)
          .then(() => this.authenticate(login))
          .catch((error) => this.handleAuthenticationError(error));
      }
    });

    // This will wait for the redirection results to complete as the state would not be checked
    // during the login process, this means that its safe to not have a check for this as it
    // would never be hit if a device was logging in from the home page, otherwise it will get
    // the local session and login again if it exists.
    authentication.onAuthStateChanged((login) => {
      if (!_.isNil(login)) {
        this.authenticate(login, true).catch((error) => this.handleAuthenticationError(error));
      } else {
        this.setState({ loading: false });
      }
    });
  }

  /**
   * Updates the users content in redux
   * @param {object} user firebase user content
   * @param {boolean} example if is a exmaple user
   */
  updateContentForUser(user, exampleUser = false, auth = false) {
    const profile = Object.assign(user.profile, { exampleUser, auth });

    this.props.updateProfile(profile);
    this.props.updateYears(user.years);
    this.props.updateNotifications(user.notifications);
    return Promise.resolve();
  }

  // Handles all errors through a single promise
  handleAuthenticationError(error) {
    this.props.snackbar.showMessage(error.showMessage);
    this.setState({ loading: false });
  }

  /**
   * Takes in a google authentication object, this object would then be used to create the new user
   * or gather the users content that would then be used to build the following images.
   * @param {AuthObject} login A authentication object based on reauthentication and authentication
   * @param {boolean} reauth If the user is reauthenticating or logging (session based)
   *
   * TODO: I need to look into making this a single check to create the user, there is duplicate
   * code that can be removed in this case.
   */
  authenticate(login, reauth = false) {
    if (_.isNil(login)) return Promise.resolve();

    return new Promise((resolve, reject) => {
      if (!reauth && login.additionalUserInfo.isNewUser) {
        firebase
          .createNewUser()
          .then(() => firebase.getUserContent())
          .then((content) => this.updateContentForUser(Object.assign(content, { new: true }), false, true))
          .then(() => firebase.updateLoginCountAndDate())
          .then(() => this.setState({ redirectToReferrer: true }))
          .catch((error) => reject(error));
      } else {
        firebase
          .getUserContent()
          .then((content) => this.updateContentForUser(content, false, true))
          .then(() => firebase.updateLoginCountAndDate())
          .then(() => this.setState({ redirectToReferrer: true }))
          .catch((error) => reject(error));
      }
    });
  }

  loginWithGoogle() {
    const { provider, authentication } = firebase;
    this.setState({ loading: true });

    if (this.state.isMobile) {
      return authentication.signInWithRedirect(provider);
    }

    return authentication
      .signInWithPopup(provider)
      .then((login) => this.authenticate(login))
      .catch((error) => this.handleAuthenticationError(error));
  }

  render() {
    const { classes } = this.props;
    const { from } = this.props.location.state || { from: { pathname: '/' } };
    const { redirectToReferrer } = this.state;

    if (redirectToReferrer && !_.isNil(from) && from.pathname !== '/') {
      return <Redirect to={from} />;
    } else if (redirectToReferrer) {
      return <Redirect to="/home" />;
    }

    if (this.state.loading) {
      return (
        <div className={classes.loading}>
          <CircularProgress className={classes.progress} color="primary" size={80} />
        </div>
      );
    }

    return (
      <div className={classes.root}>
        <img style={{ height: 150 }} src="components/resources/images/logo.svg" alt="Logo" />
        <Typography variant="h4" className={classes.title} gutterBottom>
          UniGoals
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          <Typography variant="body2">
            Full Course &amp; Unit tracking
            <br />
            built by a University{' '}
            <a href="https://www.linkedin.com/in/stephen-lineker-miller/" target="_blank" rel="noopener noreferrer">
              Student
            </a>{' '}
            for University Students
            <br />
            Version: {this.props.version}
          </Typography>
        </Typography>
        <Button variant="contained" color="primary" onClick={this.loginWithGoogle}>
          Login | Register
        </Button>
        <Card className={classes.card}>
          <CardContent>
            <Typography className={classes.text} variant="body2" component="div">
              UniGoals is a modern University unit tracking tool designed to let you know where you currently stand on your course. Using
              quick and simple percentages charts to provide fast and accurate content about your course. Simply add your units with there
              weighting (e.g.coursework, exam, presentations, etc) and quickly see your current percent, average and total maximum grade!
              Real-time instant results.
            </Typography>
            <Summary
              className={classes.summary}
              updateYearTitle={this.props.updateYearTitle}
              units={homePageData.units}
              profile={homePageData.profile}
              history={this.props.history}
              isExample={this.state.isExample}
              yearIndex="Year 1"
              yearTitle="Example Year"
              removeYear={() => undefined}
            />
            <Typography className={classes.text} variant="body2" component="div">
              Your own unqiue summary page that displays everything you need to quickly know about your units! Including your
              <strong> unit ranks</strong>, how they are compared to other units, <strong> Average</strong>, <strong>Max</strong> and
              <strong> Total Grade</strong>. Try hovering over the chart and percentages. Each unit looks like the one below, providing a
              <strong> Title</strong>, <strong>Name</strong>, <strong>Weighting</strong>, and <strong> Achieved</strong> column. Filling
              these will allow you to make the most of the site. The chart and percentages will also update in real time as you update the
              rows.
            </Typography>
            <UnitTable
              setUnitDroppedStatus={() => undefined}
              setUnitDoubleWeightStatus={() => undefined}
              isExample={this.state.isExample}
              yearIndex="example"
              tableIndex="example"
              unit={homePageData.units[Object.keys(homePageData.units)[2]]}
            />
          </CardContent>
        </Card>
      </div>
    );
  }
}

Login.propTypes = {
  classes: PropTypes.shape({}).isRequired,
  history: PropTypes.shape({}).isRequired,
  profile: PropTypes.shape({
    auth: PropTypes.bool,
  }).isRequired,
  location: PropTypes.shape({
    state: PropTypes.shape(),
  }).isRequired,
  version: PropTypes.string.isRequired,
  updateProfile: PropTypes.func.isRequired,
  updateYearTitle: PropTypes.func.isRequired,
  updateYears: PropTypes.func.isRequired,
  updateNotifications: PropTypes.func.isRequired,
  snackbar: PropTypes.shape({
    showMessage: PropTypes.func,
  }).isRequired,
};

Login.defaultProps = {};

export default withStyles(styles)(withSnackbar()(Login));
