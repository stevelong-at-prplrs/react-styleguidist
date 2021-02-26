import mdx from '@mdx-js/mdx';
import { vol } from 'memfs';
import exportStories from '../exportStories';

jest.mock('fs', () => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	return require('memfs').fs;
});

afterEach(() => {
	vol.reset();
});

const compile = async (mdxContent: string, storyContent: string) => {
	vol.fromJSON({ '/Pizza/Pizza.stories.tsx': storyContent });
	const result = await mdx(mdxContent, {
		filepath: 'Pizza.md',
		rehypePlugins: [
			exportStories({ componentPath: './index.tsx', mdxDocumentPath: '/Pizza/Readme.md' }),
		],
	});

	// Strip repeated parts
	return result.split('/* @jsx mdx */')[1].split('const MDXLayout = "wrapper"')[0];
};

describe('stories', () => {
	test('camel case names stays as camel case', async () => {
		const result = await compile(
			`Henlo`,
			`
export const camelCaseStory = () => <Container><Button /></Container>
`
		);
		expect(result).toMatchInlineSnapshot(`
		"

		export const __namedExamples = {
		  'camelCaseStory': '<Container><Button /></Container>'
		};
		export const __storiesScope = {};

		const layoutProps = {
		  __namedExamples,
		__storiesScope
		};
		"
	`);
	});

	test('pascal case names are converted to camel case', async () => {
		const result = await compile(
			`Henlo`,
			`
export const PascalCaseStory = () => <Container><Button /></Container>
`
		);
		expect(result).toMatchInlineSnapshot(`
		"

		export const __namedExamples = {
		  'pascalCaseStory': '<Container><Button /></Container>'
		};
		export const __storiesScope = {};

		const layoutProps = {
		  __namedExamples,
		__storiesScope
		};
		"
	`);
	});
});

describe('imports', () => {
	test('default import', async () => {
		const result = await compile(
			`Henlo`,
			`
import Container from './Container';
export const basic = () => <Container><Button /></Container>
`
		);
		expect(result).toMatchInlineSnapshot(`
		"
		import * as __story_import_0 from './Container'
		export const __namedExamples = {
		  'basic': 'import Container from \\\\'./Container\\\\';\\\\n\\\\n<Container><Button /></Container>'
		};
		export const __storiesScope = {
		  './Container': __story_import_0
		};

		const layoutProps = {
		  __namedExamples,
		__storiesScope
		};
		"
	`);
	});

	test('named import', async () => {
		const result = await compile(
			`Henlo`,
			`
import { Button, Input } from './components';
export const basic = () => <Container><Button /></Container>
`
		);
		expect(result).toMatchInlineSnapshot(`
		"
		import * as __story_import_0 from './components'
		export const __namedExamples = {
		  'basic': 'import { Button, Input } from \\\\'./components\\\\';\\\\n\\\\n<Container><Button /></Container>'
		};
		export const __storiesScope = {
		  './components': __story_import_0
		};

		const layoutProps = {
		  __namedExamples,
		__storiesScope
		};
		"
	`);
	});

	test('mixed import', async () => {
		const result = await compile(
			`Henlo`,
			`
import Input, { Button } from './components';
export const basic = () => <Container><Button /></Container>
`
		);
		expect(result).toMatchInlineSnapshot(`
		"
		import * as __story_import_0 from './components'
		export const __namedExamples = {
		  'basic': 'import Input, { Button } from \\\\'./components\\\\';\\\\n\\\\n<Container><Button /></Container>'
		};
		export const __storiesScope = {
		  './components': __story_import_0
		};

		const layoutProps = {
		  __namedExamples,
		__storiesScope
		};
		"
	`);
	});

	test('named import with renaming', async () => {
		const result = await compile(
			`Henlo`,
			`
import { Input as Button } from './components';
export const basic = () => <Container><Button /></Container>
`
		);
		expect(result).toMatchInlineSnapshot(`
		"
		import * as __story_import_0 from './components'
		export const __namedExamples = {
		  'basic': 'import { Input as Button } from \\\\'./components\\\\';\\\\n\\\\n<Container><Button /></Container>'
		};
		export const __storiesScope = {
		  './components': __story_import_0
		};

		const layoutProps = {
		  __namedExamples,
		__storiesScope
		};
		"
	`);
	});

	test('wildcard import', async () => {
		const result = await compile(
			`Henlo`,
			`
import * as Buttons from './Buttons';
export const basic = () => <Container><Buttons.Button /></Container>
`
		);
		expect(result).toMatchInlineSnapshot(`
		"
		import * as __story_import_0 from './Buttons'
		export const __namedExamples = {
		  'basic': 'import * as Buttons from \\\\'./Buttons\\\\';\\\\n\\\\n<Container><Buttons.Button /></Container>'
		};
		export const __storiesScope = {
		  './Buttons': __story_import_0
		};

		const layoutProps = {
		  __namedExamples,
		__storiesScope
		};
		"
	`);
	});

	test('skips current component', async () => {
		const result = await compile(
			`Henlo`,
			`
import Pizza from './Pizza';
import Container from './Container';
export const basic = () => <Container><Pizza /></Container>
`
		);
		expect(result).toMatchInlineSnapshot(`
		"
		import * as __story_import_0 from './Pizza'
		import * as __story_import_1 from './Container'
		export const __namedExamples = {
		  'basic': 'import Container from \\\\'./Container\\\\';\\\\n\\\\n<Container><Pizza /></Container>'
		};
		export const __storiesScope = {
		  './Pizza': __story_import_0,
		  './Container': __story_import_1
		};

		const layoutProps = {
		  __namedExamples,
		__storiesScope
		};
		"
	`);
	});

	test('skips current component (named import)', async () => {
		const result = await compile(
			`Henlo`,
			`
import { Pizza } from '.';
import Container from './Container';
export const basic = () => <Container><Pizza /></Container>
`
		);
		expect(result).toMatchInlineSnapshot(`
		"
		import * as __story_import_0 from '.'
		import * as __story_import_1 from './Container'
		export const __namedExamples = {
		  'basic': 'import Container from \\\\'./Container\\\\';\\\\n\\\\n<Container><Pizza /></Container>'
		};
		export const __storiesScope = {
		  '.': __story_import_0,
		  './Container': __story_import_1
		};

		const layoutProps = {
		  __namedExamples,
		__storiesScope
		};
		"
	`);
	});

	test('includes the current component when it is not the only import', async () => {
		const result = await compile(
			`Henlo`,
			`
import Pizza, { cheese } from './Pizza';
import Container from './Container';
export const basic = () => <Container><Pizza toppings={[cheese]} /></Container>
`
		);
		expect(result).toMatchInlineSnapshot(`
		"
		import * as __story_import_0 from './Pizza'
		import * as __story_import_1 from './Container'
		export const __namedExamples = {
		  'basic': 'import Pizza, { cheese } from \\\\'./Pizza\\\\';\\\\nimport Container from \\\\'./Container\\\\';\\\\n\\\\n<Container><Pizza toppings={[cheese]} /></Container>'
		};
		export const __storiesScope = {
		  './Pizza': __story_import_0,
		  './Container': __story_import_1
		};

		const layoutProps = {
		  __namedExamples,
		__storiesScope
		};
		"
	`);
	});

	test('unused imports', async () => {
		const result = await compile(
			`Henlo`,
			`
import * as React from 'react';
import { Coffee, Milk } from './drinks';
export const basic = () => <Container><Button /></Container>
`
		);
		expect(result).toMatchInlineSnapshot(`
		"
		import * as __story_import_0 from 'react'
		import * as __story_import_1 from './drinks'
		export const __namedExamples = {
		  'basic': '<Container><Button /></Container>'
		};
		export const __storiesScope = {
		  'react': __story_import_0,
		  './drinks': __story_import_1
		};

		const layoutProps = {
		  __namedExamples,
		__storiesScope
		};
		"
	`);
	});

	test('adds semicolon', async () => {
		const result = await compile(
			`Henlo`,
			`
import Container from './Container'
export const basic = () => <Container><Button /></Container>
`
		);
		expect(result).toMatchInlineSnapshot(`
		"
		import * as __story_import_0 from './Container'
		export const __namedExamples = {
		  'basic': 'import Container from \\\\'./Container\\\\';\\\\n\\\\n<Container><Button /></Container>'
		};
		export const __storiesScope = {
		  './Container': __story_import_0
		};

		const layoutProps = {
		  __namedExamples,
		__storiesScope
		};
		"
	`);
	});
});

describe('local variables', () => {
	test('const', async () => {
		const result = await compile(
			`Henlo`,
			`
const pizza = 'pizza';
export const basic = () => <Container>{pizza}</Container>
`
		);
		expect(result).toMatchInlineSnapshot(`
		"

		export const __namedExamples = {
		  'basic': 'const pizza = \\\\'pizza\\\\';\\\\n\\\\n<Container>{pizza}</Container>'
		};
		export const __storiesScope = {};

		const layoutProps = {
		  __namedExamples,
		__storiesScope
		};
		"
	`);
	});

	test('destructuring', async () => {
		const result = await compile(
			`Henlo`,
			`
const { coffee } = {coffee: 'V60'};
export const basic = () => <Container>{coffee}</Container>
`
		);
		expect(result).toMatchInlineSnapshot(`
		"

		export const __namedExamples = {
		  'basic': 'const { coffee } = {coffee: \\\\'V60\\\\'};\\\\n\\\\n<Container>{coffee}</Container>'
		};
		export const __storiesScope = {};

		const layoutProps = {
		  __namedExamples,
		__storiesScope
		};
		"
	`);
	});

	test('destructuring with renaming', async () => {
		const result = await compile(
			`Henlo`,
			`
const { coffee: pizza } = {coffee: 'V60'};
export const basic = () => <Container>{pizza}</Container>
`
		);
		expect(result).toMatchInlineSnapshot(`
		"

		export const __namedExamples = {
		  'basic': 'const { coffee: pizza } = {coffee: \\\\'V60\\\\'};\\\\n\\\\n<Container>{pizza}</Container>'
		};
		export const __storiesScope = {};

		const layoutProps = {
		  __namedExamples,
		__storiesScope
		};
		"
	`);
	});

	test('destructuring with rest', async () => {
		const result = await compile(
			`Henlo`,
			`
const { coffee, ...rest } = {coffee: 'V60'};
export const basic = () => <Container>{rest.map(x => <p>{x}</p>)}</Container>
`
		);
		expect(result).toMatchInlineSnapshot(`
		"

		export const __namedExamples = {
		  'basic': 'const { coffee, ...rest } = {coffee: \\\\'V60\\\\'};\\\\n\\\\n<Container>{rest.map(x => <p>{x}</p>)}</Container>'
		};
		export const __storiesScope = {};

		const layoutProps = {
		  __namedExamples,
		__storiesScope
		};
		"
	`);
	});

	test('unused variable', async () => {
		const result = await compile(
			`Henlo`,
			`
const coffee = 'V60';
export const basic = () => <Container>pizza</Container>
`
		);
		expect(result).toMatchInlineSnapshot(`
		"

		export const __namedExamples = {
		  'basic': '<Container>pizza</Container>'
		};
		export const __storiesScope = {};

		const layoutProps = {
		  __namedExamples,
		__storiesScope
		};
		"
	`);
	});

	test('partial name', async () => {
		const result = await compile(
			`Henlo`,
			`
const java = 'Java is to JavaScript as ham is to hamster';
export const basic = () => <Container>{javascript}</Container>
`
		);
		expect(result).toMatchInlineSnapshot(`
		"

		export const __namedExamples = {
		  'basic': '<Container>{javascript}</Container>'
		};
		export const __storiesScope = {};

		const layoutProps = {
		  __namedExamples,
		__storiesScope
		};
		"
	`);
	});

	test('adds semicolon', async () => {
		const result = await compile(
			`Henlo`,
			`
const pizza = 'pizza'
export const basic = () => <Container>{pizza}</Container>
`
		);
		expect(result).toMatchInlineSnapshot(`
		"

		export const __namedExamples = {
		  'basic': 'const pizza = \\\\'pizza\\\\';\\\\n\\\\n<Container>{pizza}</Container>'
		};
		export const __storiesScope = {};

		const layoutProps = {
		  __namedExamples,
		__storiesScope
		};
		"
	`);
	});

	test('understands TypeScript', async () => {
		const result = await compile(
			`Henlo`,
			`
const nums = ['eins', 'zwei', 'polizei'] as const;
export const basic = () => <Container>{nums.map(x => x)}</Container>
`
		);
		expect(result).toMatchInlineSnapshot(`
		"

		export const __namedExamples = {
		  'basic': 'const nums = [\\\\'eins\\\\', \\\\'zwei\\\\', \\\\'polizei\\\\'];\\\\n\\\\n<Container>{nums.map(x => x)}</Container>'
		};
		export const __storiesScope = {};

		const layoutProps = {
		  __namedExamples,
		__storiesScope
		};
		"
	`);
	});
});
