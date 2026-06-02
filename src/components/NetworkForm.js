import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Field } from 'react-final-form';
import {
  Col,
  Row,
  TextField,
} from '@folio/stripes/components';
import { required } from '../util/validators';

const NetworkForm = () => {
  return (
    <Row>
      <Col xs={12}>
        <Field
          name="name"
          component={TextField}
          label={<FormattedMessage id="ui-rsdir.network.name" />}
          required
          validate={required}
        />
      </Col>
    </Row>
  );
};

export default NetworkForm;
