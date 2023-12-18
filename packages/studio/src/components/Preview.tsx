import styles from './Preview.module.css';

interface Props {
  videoSrc: string;
}

export function Preview({ videoSrc }: Props) {
  return <video className={styles.video} src={videoSrc} controls />;
}
