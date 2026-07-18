#!/usr/bin/env node

import { Box, Text, render } from "ink";

const App = () => (
  <Box
    width={38}
    flexDirection="column"
    borderStyle="round"
    borderColor="#52525b"
    paddingX={2}
    paddingY={1}
    marginY={1}
  >
    <Box>
      <Text color="#8b5cf6">●</Text>
      <Text bold> Farpoint</Text>
    </Box>

    <Box marginTop={1}>
      <Text color="#71717a">› </Text>
      <Text>hi</Text>
    </Box>
  </Box>
);

render(<App />);
