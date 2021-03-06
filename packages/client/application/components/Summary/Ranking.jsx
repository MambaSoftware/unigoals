import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import PropTypes from 'prop-types';
import uuid from 'uuid/v4';
import React from 'react';
import _ from 'lodash';

import { functionRankUnitByAchieved } from '../../utils/utils';

const styles = (theme) => ({
  root: {
    marginTop: theme.spacing.unit,
    paddingLeft: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
    minHeight: '100px',
  },
  title: {
    textAlign: 'left',
    paddingTop: theme.spacing.unit,
  },
  entry: {
    marginTop: theme.spacing.unit,
  },
  link: {
    textDecoration: 'none',
    color: 'inherit',
  },
  wrapper: {
    paddingRight: theme.spacing.unit * 5,
    textAlign: 'left',
  },
});

const Ranking = (props) => {
  const { classes } = props;
  const ranking = functionRankUnitByAchieved(props.units, props.history);

  return (
    <Paper square style={{ height: props.height * 40 }} className={classes.root} elevation={1}>
      <Typography className={classes.title} component="p" variant="body2">
        Unit Ranking
      </Typography>
      <Typography className={classes.wrapper} component="div" variant="body2">
        {!_.isNil(ranking) &&
          ranking.map((rank, index) => (
            <Typography key={uuid()} className={classes.entry} component="div" variant="body2">
              <Typography className={classes.link} href={String(rank.link)} component="a" variant="body2">
                {index + 1}. {rank.title} {rank.double ? '(double)' : ''} {rank.dropped ? '(dropped)' : ''}
              </Typography>
            </Typography>
          ))}
      </Typography>
    </Paper>
  );
};

Ranking.propTypes = {
  classes: PropTypes.shape({}).isRequired,
  history: PropTypes.shape({}).isRequired,
  units: PropTypes.shape({}),
  height: PropTypes.number.isRequired,
};

Ranking.defaultProps = {
  units: null,
};

export default withStyles(styles)(Ranking);
