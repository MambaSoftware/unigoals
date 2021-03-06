import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Icon from '@material-ui/core/Icon';

import { withSnackbar } from '../Utilities/SnackbarWrapper';
import * as constants from '../../utils/constants';
import firebase from '../../utils/FirebaseWrapper';
import Expandable from '../Table/Expandable';

const styles = (theme) => ({
  root: {
    margin: '0 auto',
    maxWidth: '60%',
    marginBottom: theme.spacing.unit * 5,
    paddingBottom: theme.spacing.unit * 3,
    [theme.breakpoints.down('md')]: {
      maxWidth: '70%',
    },
    [theme.breakpoints.down('sm')]: {
      maxWidth: '90%',
    },
  },
  button: {
    margin: theme.spacing.unit,
  },
});

class Tables extends React.Component {
  constructor() {
    super();

    this.addTable = this.addTable.bind(this);
    this.insertTableAndNavigate = this.insertTableAndNavigate.bind(this);

    this.state = {};
  }

  /**
   * Inserts the new table into redux and navigates on the site
   * @param {string} ref reference to the new table
   */
  insertTableAndNavigate(ref) {
    this.props.addUnitTable(this.props.yearIndex, ref);
    const element = document.getElementById(ref);
    element.scrollIntoView();
    return Promise.resolve();
  }

  /**
   * Used to call the creation of the table in firebase
   * @param {string} ref reference of table
   */
  addTable() {
    if (_.size(this.props.units) >= constants.UNIT.MAX) {
      this.props.snackbar.showMessage(`Only a maximum of ${constants.UNIT.MAX} units at anyone time`);
    } else {
      firebase
        .insertUnitById(this.props.yearIndex)
        .then((ref) => this.insertTableAndNavigate(ref))
        .then(() => this.props.snackbar.showMessage('Added new unit'))
        .catch((error) => this.props.snackbar.showMessage(error.message));
    }
  }

  render() {
    const { classes } = this.props;

    return (
      <Paper square elevation={0} className={classes.root}>
        <Button color="primary" className={classes.button} onClick={this.addTable}>
          <Icon>add</Icon> Add Unit
        </Button>
        {!_.isNil(this.props.units) &&
          _.map(this.props.units, (unit, index) => (
            <div key={index} id={`${index}`}>
              <Expandable
                setUnitDoubleWeightStatus={this.props.setUnitDoubleWeightStatus}
                setUnitDroppedStatus={this.props.setUnitDroppedStatus}
                tableIndex={index}
                yearIndex={this.props.yearIndex}
                insertUnitRow={this.props.insertUnitRow}
                updateRowContent={this.props.updateRowContent}
                removeUnitRow={this.props.removeUnitRow}
                updateUnitTitle={this.props.updateUnitTitle}
                addUnitTable={this.props.addUnitTable}
                removeUnitTable={this.props.removeUnitTable}
                unit={unit}
                isExample={this.props.isExample}
              />
            </div>
          ))}
      </Paper>
    );
  }
}

Tables.propTypes = {
  yearIndex: PropTypes.string.isRequired,
  classes: PropTypes.shape({}).isRequired,
  units: PropTypes.shape({}),
  setUnitDoubleWeightStatus: PropTypes.func.isRequired,
  setUnitDroppedStatus: PropTypes.func.isRequired,
  insertUnitRow: PropTypes.func.isRequired,
  removeUnitRow: PropTypes.func.isRequired,
  addUnitTable: PropTypes.func.isRequired,
  removeUnitTable: PropTypes.func.isRequired,
  updateUnitTitle: PropTypes.func.isRequired,
  updateRowContent: PropTypes.func.isRequired,
  isExample: PropTypes.bool,
  snackbar: PropTypes.shape({
    showMessage: PropTypes.func,
  }).isRequired,
};

Tables.defaultProps = {
  isExample: false,
  units: null,
};

export default withStyles(styles)(withSnackbar()(Tables));
