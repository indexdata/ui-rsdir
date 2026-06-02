import React from 'react';
import { FormattedMessage } from 'react-intl';
import {
  Pane,
  Paneset,
} from '@folio/stripes/components';

const TiersRoute = () => {
  return (
    <Paneset>
      <Pane
        defaultWidth="fill"
        paneTitle={<FormattedMessage id="ui-rsdir.tabs.tiers" />}
      >
        <FormattedMessage id="ui-rsdir.tiers.placeholder" />
      </Pane>
    </Paneset>
  );
};

export default TiersRoute;
