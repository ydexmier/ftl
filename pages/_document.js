// pages/_document.tsx
import Document, {Html, Head, Main, NextScript} from 'next/document';
import {ServerStyleSheet as StyledComponentSheets} from 'styled-components';
import {ServerStyleSheets as MuiServerStyleSheets} from '@mui/styles';

export default class MyDocument extends Document {
    static async getInitialProps(ctx) {
        const styledComponentSheet = new StyledComponentSheets();
        const muiSheets = new MuiServerStyleSheets();
        const originalRenderPage = ctx.renderPage;

        try {
            ctx.renderPage = () =>
                originalRenderPage({
                    enhanceApp: (App) => (props) =>
                        styledComponentSheet.collectStyles(
                            muiSheets.collect(<App {...props} />)
                        ),
                });

            const initialProps = await Document.getInitialProps(ctx);
            return {
                ...initialProps,
                styles: (
                    <>
                        {initialProps.styles}
                        {muiSheets.getStyleElement()}
                        {styledComponentSheet.getStyleElement()}
                    </>
                ),
            };
        } finally {
            styledComponentSheet.seal();
        }
    }

    render() {
        return (
            <Html lang="fr">
                <Head>{/* Tu peux ajouter tes fonts ou meta ici */}</Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}
