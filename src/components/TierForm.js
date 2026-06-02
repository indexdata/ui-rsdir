import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Field } from 'react-final-form';
import {
  Col,
  Row,
  TextField,
} from '@folio/stripes/components';
import { required } from '../util/validators';

const TierForm = () => {
  return (
    <Row>
      <Col xs={12}>
        <Field
          name="name"
          component={TextField}
          label={<FormattedMessage id="ui-rsdir.tier.name" />}
          required
          validate={required}
        />
      </Col>
    </Row>
  );
};

export default TierForm;
