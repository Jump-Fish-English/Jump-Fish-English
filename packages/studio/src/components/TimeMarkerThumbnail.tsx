import { TimeMarker } from './TimeMarker';

import styles from './TimeMarkerThumbnail.module.css';

export function TimeMarkerThumbnail({ previewImageUrl }: { previewImageUrl: string }) {
  return (
    <div className={styles.container}>
      <img className={styles.image} src={previewImageUrl} />
    </div>
  )
}