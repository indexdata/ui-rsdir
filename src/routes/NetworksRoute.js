import React from 'react';

import RestResourceManager from '../components/RestResourceManager';

const fields = [
  {
    name: 'name',
    displayName: 'ui-rsdir.network.name',
    fieldType: 'string',
    listingField: true,
    required: true,
  },
];

const NetworksRoute = props => (
  <RestResourceManager
    {...props}
    endpoint="rsdir/networks"
    fields={fields}
    resourceName="Networks"
    singularResourceName="Network"
  />
);

export default NetworksRoute;
